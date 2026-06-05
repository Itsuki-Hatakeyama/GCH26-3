import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

const PER_PAGE = 15

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('*')
    .eq('id', id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  // オーナーでない場合はアクティブメンバーか確認
  if (repo.user_id !== session.user_id) {
    const { data: membership } = await supabaseAdmin
      .from('repository_members')
      .select('id')
      .eq('repository_id', id)
      .eq('user_id', session.user_id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
    }
  }

  // GitHub トークンはリポジトリオーナーのものを使用
  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', repo.user_id)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'GitHub未連携です' } }, { status: 400 })
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10)
  const accessToken = await decrypt(integration.access_token_encrypted)

  // 全ブランチを取得
  const allBranches = await github.getBranches(accessToken, repo.owner, repo.name) as { name: string }[]
  const branchNames = allBranches.map((b) => b.name)

  if (branchNames.length === 0) {
    return NextResponse.json({ synced: 0, hasNextPage: false, branches: [] })
  }

  // 全ブランチのコミットを並列取得
  const branchResults = await Promise.all(
    branchNames.map(async (branchName) => {
      const commits = await github.getCommits(accessToken, repo.owner, repo.name, PER_PAGE, branchName, page)
      return { branchName, commits: commits as {
        sha: string
        commit: { message: string; author: { name: string; email: string; date: string } }
        html_url: string
      }[] }
    })
  )

  const hasNextPage = branchResults.some((r) => r.commits.length === PER_PAGE)

  // SHA をキーにコミットを集約（同じコミットが複数ブランチにある場合に重複排除）
  const commitMap = new Map<string, { row: Record<string, unknown>; branches: string[] }>()
  for (const { branchName, commits } of branchResults) {
    for (const c of commits) {
      if (commitMap.has(c.sha)) {
        commitMap.get(c.sha)!.branches.push(branchName)
      } else {
        commitMap.set(c.sha, {
          row: {
            repository_id: id,
            sha: c.sha,
            message: c.commit.message,
            author_name: c.commit.author.name,
            author_email: c.commit.author.email,
            committed_at: c.commit.author.date,
            html_url: c.html_url,
          },
          branches: [branchName],
        })
      }
    }
  }

  if (commitMap.size === 0) {
    return NextResponse.json({ synced: 0, hasNextPage: false, branches: branchNames })
  }

  const rows = Array.from(commitMap.values()).map((v) => v.row)

  // コミットをupsert
  const { error, data: upserted } = await supabaseAdmin
    .from('commits')
    .upsert(rows, { onConflict: 'repository_id,sha' })
    .select('id, sha, branch_names')

  if (error) {
    console.error('[sync] DB error:', error)
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'コミット保存に失敗しました' } }, { status: 500 })
  }

  // branch_names を更新（既存の配列に新しいブランチ名をマージ）
  for (const commit of upserted ?? []) {
    const newBranches = commitMap.get(commit.sha)?.branches ?? []
    const existing: string[] = commit.branch_names ?? []
    const merged = [...new Set([...existing, ...newBranches])]
    if (merged.length !== existing.length) {
      await supabaseAdmin
        .from('commits')
        .update({ branch_names: merged })
        .eq('id', commit.id)
    }
  }

  console.log(`[sync] repo=${repo.owner}/${repo.name} page=${page} branches=${branchNames.length} commits=${commitMap.size}`)

  return NextResponse.json({ synced: commitMap.size, hasNextPage, branches: branchNames })
}
