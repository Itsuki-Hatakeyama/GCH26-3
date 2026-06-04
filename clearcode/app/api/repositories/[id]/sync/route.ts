import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'
import { generateSummary } from '@/lib/services/summary-service'

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
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', session.user_id)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'GitHub未連携です' } }, { status: 400 })
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10)
  const accessToken = await decrypt(integration.access_token_encrypted)
  const commits = await github.getCommits(accessToken, repo.owner, repo.name, PER_PAGE, undefined, page)
  const hasNextPage = commits.length === PER_PAGE

  console.log(`[sync] repo=${repo.owner}/${repo.name} page=${page} commits_from_github=${commits.length}`)

  if (commits.length === 0) {
    return NextResponse.json({ synced: 0, hasNextPage: false })
  }

  const rows = commits.map((c: {
    sha: string
    commit: { message: string; author: { name: string; email: string; date: string } }
    html_url: string
  }) => ({
    repository_id: id,
    sha: c.sha,
    message: c.commit.message,
    author_name: c.commit.author.name,
    author_email: c.commit.author.email,
    committed_at: c.commit.author.date,
    html_url: c.html_url,
  }))

  const { error, data: upserted } = await supabaseAdmin
    .from('commits')
    .upsert(rows, { onConflict: 'repository_id,sha' })
    .select('id')

  console.log(`[sync] upsert result: count=${upserted?.length ?? 0} error=${JSON.stringify(error)}`)

  if (error) {
    console.error('[sync] DB error:', error)
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'コミット保存に失敗しました', detail: error.message } }, { status: 500 })
  }

  // 要約がまだないコミットに対して Gemini で生成（最新5件のみ、レート制限対策）
  const commitIds = (upserted ?? []).map((r) => r.id)
  if (commitIds.length > 0) {
    const { data: existingSummaries } = await supabaseAdmin
      .from('commit_summaries')
      .select('commit_id')
      .in('commit_id', commitIds)

    const alreadySummarized = new Set((existingSummaries ?? []).map((s) => s.commit_id))
    const toSummarize = commitIds.filter((cid) => !alreadySummarized.has(cid)).slice(0, 5)

    for (const commitId of toSummarize) {
      const commitRow = rows[commitIds.indexOf(commitId)]
      if (!commitRow) continue

      // 変更ファイル一覧をGitHubから取得してDBに保存
      try {
        const commitDetail = await github.getCommit(accessToken, repo.owner, repo.name, commitRow.sha)
        const changedFiles: string[] = (commitDetail.files ?? []).map((f: { filename: string }) => f.filename)
        if (changedFiles.length > 0) {
          await supabaseAdmin.from('commits').update({ changed_files: changedFiles }).eq('id', commitId)
        }
      } catch {
        // ファイル取得失敗時はスキップ
      }

      const summary = await generateSummary(commitRow.message, '')
      if (summary) {
        await supabaseAdmin.from('commit_summaries').upsert(
          { commit_id: commitId, ...summary },
          { onConflict: 'commit_id' }
        )
      }
    }
  }

  return NextResponse.json({ synced: rows.length, saved: upserted?.length ?? 0, hasNextPage })
}
