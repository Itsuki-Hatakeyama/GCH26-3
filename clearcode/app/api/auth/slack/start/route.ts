import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const repository_id = request.nextUrl.searchParams.get('repository_id')

  if (!repository_id) {
    return NextResponse.json({ error: 'repository_id is required' }, { status: 400 })
  }

  // ユーザーの OAuth 資格情報を優先、なければ環境変数
  const session = await getSession()
  let clientId = process.env.SLACK_CLIENT_ID!
  const redirectUri = process.env.SLACK_REDIRECT_URI!

  if (session) {
    const result = await query<{ slack_client_id: string | null }>(
      'SELECT slack_client_id FROM users WHERE id = $1',
      [session.user_id]
    )
    const userClientId = result.rows[0]?.slack_client_id
    if (userClientId) clientId = userClientId
  }

  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
  slackAuthUrl.searchParams.set('client_id', clientId)
  slackAuthUrl.searchParams.set('scope', 'chat:write,channels:read,files:write')
  slackAuthUrl.searchParams.set('redirect_uri', redirectUri)
  // state に user_id を含めてコールバックで資格情報を特定できるようにする
  const statePayload = session
    ? `${repository_id}:${session.user_id}`
    : repository_id
  slackAuthUrl.searchParams.set('state', statePayload)

  return NextResponse.redirect(slackAuthUrl.toString())
}
