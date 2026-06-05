import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { sendCommitNotification } from '@/lib/services/notification-service'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'
import { query } from '@/lib/db'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sha: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id, sha } = await params

  // before/after スクリーンショット（base64 data URL）をボディから取得
  let beforeImage: Buffer | undefined
  let afterImage: Buffer | undefined
  try {
    const body = await req.json()
    if (typeof body.beforeImage === 'string') {
      const base64 = body.beforeImage.split(',').pop() ?? body.beforeImage
      beforeImage = Buffer.from(base64, 'base64')
    }
    if (typeof body.afterImage === 'string') {
      const base64 = body.afterImage.split(',').pop() ?? body.afterImage
      afterImage = Buffer.from(base64, 'base64')
    }
  } catch {
    // ボディなしの呼び出しも許容
  }

  const { data: repo } = await supabase()
    .from('repositories')
    .select('name, owner, user_id')
    .eq('id', id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // オーナーでない場合はメンバーか確認
  if (repo.user_id !== session.user_id) {
    const { data: membership } = await supabase()
      .from('repository_members')
      .select('id')
      .eq('repository_id', id)
      .eq('user_id', session.user_id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
    }
  }

  const { data: commit } = await supabase()
    .from('commits')
    .select('sha, message, author_name, html_url, commit_summaries(*)')
    .eq('repository_id', id)
    .eq('sha', sha)
    .single()

  if (!commit) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  // デバッグ: is_active に関わらず全レコードを確認
  const { data: slackDebug } = await supabase()
    .from('slack_integrations')
    .select('repository_id, channel_id, channel_name, is_active, workspace_name')
    .eq('repository_id', id)
  console.log('[notify] slack_integrations for repo', id, ':', JSON.stringify(slackDebug))

  const { data: slack } = await supabase()
    .from('slack_integrations')
    .select('channel_id, channel_name, access_token_encrypted')
    .eq('repository_id', id)
    .eq('is_active', true)
    .single()

  if (!slack) {
    return NextResponse.json(
      { error: { code: 'NO_SLACK', message: 'Slack連携が設定されていません' } },
      { status: 400 }
    )
  }

  // GitHub diff 取得（オーナーのトークンを使用）
  let diff: string | undefined
  const { data: ghIntegration } = await supabase()
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', repo.user_id)
    .single()

  if (ghIntegration?.access_token_encrypted) {
    try {
      const ghToken = await decrypt(ghIntegration.access_token_encrypted)
      const rawDiff = await github.getCommitDiff(ghToken, repo.owner, repo.name, sha)
      diff = rawDiff || undefined
    } catch {
      // diff は任意なので失敗しても続行
    }
  }

  const summaries = Array.isArray(commit.commit_summaries)
    ? commit.commit_summaries
    : commit.commit_summaries ? [commit.commit_summaries] : []
  const summary = summaries[0] ?? null

  // Bot Tokenモード（access_token_encryptedが空）のとき、リポジトリオーナーのユーザートークンを使用
  let resolvedAccessToken = slack.access_token_encrypted
  if (!resolvedAccessToken) {
    const ownerResult = await query<{ slack_bot_token_encrypted: string | null }>(
      'SELECT slack_bot_token_encrypted FROM users WHERE id = $1',
      [repo.user_id]
    )
    const ownerToken = ownerResult.rows[0]?.slack_bot_token_encrypted
    if (ownerToken) {
      resolvedAccessToken = ownerToken
    }
  }

  await sendCommitNotification({
    accessTokenEncrypted: resolvedAccessToken,
    channelId: slack.channel_id,
    repoName: repo.name,
    commitSha: commit.sha,
    authorName: commit.author_name,
    simplifiedMessage: summary?.simplified_message ?? commit.message,
    codeExplanation: summary?.code_explanation ?? '',
    commitUrl: commit.html_url,
    diff,
    beforeImage,
    afterImage,
  })

  return NextResponse.json({ ok: true, channel: slack.channel_name })
}
