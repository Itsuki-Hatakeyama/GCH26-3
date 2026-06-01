import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/auth'
import { sendCommitNotification } from '@/lib/services/notification-service'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sha: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id, sha } = await params

  const { data: repo } = await supabase()
    .from('repositories')
    .select('name')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
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

  const summaries = Array.isArray(commit.commit_summaries)
    ? commit.commit_summaries
    : commit.commit_summaries ? [commit.commit_summaries] : []
  const summary = summaries[0] ?? null

  await sendCommitNotification({
    accessTokenEncrypted: slack.access_token_encrypted,
    channelId: slack.channel_id,
    repoName: repo.name,
    commitSha: commit.sha,
    authorName: commit.author_name,
    simplifiedMessage: summary?.simplified_message ?? commit.message,
    codeExplanation: summary?.code_explanation ?? '',
    commitUrl: commit.html_url,
  })

  return NextResponse.json({ ok: true, channel: slack.channel_name })
}
