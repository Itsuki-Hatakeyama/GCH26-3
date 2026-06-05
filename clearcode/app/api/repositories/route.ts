import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { data: ownedRepos } = await supabaseAdmin
    .from('repositories')
    .select('*, slack_integrations(channel_name, is_active)')
    .eq('user_id', session.user_id)
    .order('updated_at', { ascending: false })

  const { data: memberships } = await supabaseAdmin
    .from('repository_members')
    .select('repository_id')
    .eq('user_id', session.user_id)
    .eq('status', 'active')

  const memberRepoIds = (memberships ?? []).map((m: { repository_id: string }) => m.repository_id)

  let memberRepos: typeof ownedRepos = []
  if (memberRepoIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('repositories')
      .select('*, slack_integrations(channel_name, is_active)')
      .in('id', memberRepoIds)
      .order('updated_at', { ascending: false })
    memberRepos = data ?? []
  }

  const ownedWithFlag = (ownedRepos ?? []).map((r) => ({ ...r, is_owner: true }))
  const memberWithFlag = memberRepos.map((r) => ({ ...r, is_owner: false }))
  const repos = [...ownedWithFlag, ...memberWithFlag]
  if (repos.length === 0) return NextResponse.json({ repositories: [] })

  // 未読コミット数を付加
  const reposWithUnread = await Promise.all(
    repos.map(async (repo) => {
      let unread_count = 0
      if (repo.last_viewed_at) {
        const { count } = await supabaseAdmin
          .from('commits')
          .select('id', { count: 'exact', head: true })
          .eq('repository_id', repo.id)
          .gt('committed_at', repo.last_viewed_at)
        unread_count = count ?? 0
      }
      const slackArr = Array.isArray(repo.slack_integrations) ? repo.slack_integrations : []
      const slack_integration = slackArr[0] ?? null
      const { slack_integrations: _, ...repoData } = repo
      return { ...repoData, unread_count, slack_integration }
    })
  )

  return NextResponse.json({ repositories: reposWithUnread })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { repo_ids } = await req.json()
  if (!Array.isArray(repo_ids) || repo_ids.length === 0) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'repo_idsが必要です' } }, { status: 400 })
  }

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', session.user_id)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'GitHub未連携です' } }, { status: 400 })
  }

  const accessToken = await decrypt(integration.access_token_encrypted)
  const allRepos = await github.getRepositories(accessToken)

  const toInsert = allRepos
    .filter((r: Record<string, unknown>) => repo_ids.includes(String(r.id)))
    .map((r: Record<string, unknown>) => ({
      user_id: session.user_id,
      github_repo_id: String(r.id),
      name: r.name,
      full_name: r.full_name,
      owner: (r.owner as Record<string, unknown>)?.login,
      description: r.description,
      html_url: r.html_url,
      default_branch: r.default_branch || 'main',
      is_private: r.private,
    }))

  const { data, error } = await supabaseAdmin
    .from('repositories')
    .upsert(toInsert, { onConflict: 'user_id,github_repo_id' })
    .select()

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'リポジトリの保存に失敗しました' } }, { status: 500 })
  }

  // Webhook登録
  for (const repo of (data ?? [])) {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`
    await github.createWebhook(accessToken, repo.owner, repo.name, webhookUrl)
  }

  return NextResponse.json({ repositories: data })
}
