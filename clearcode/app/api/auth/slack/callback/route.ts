import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/crypto'
import { decrypt } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { query } from '@/lib/db'

async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
) {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  })
  const data = await response.json()
  if (!data.ok) throw new Error(`Slack OAuth error: ${data.error}`)
  return data
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state') // "repository_id" or "repository_id:user_id"
    const slackError = request.nextUrl.searchParams.get('error')

    if (slackError) {
      return NextResponse.redirect(
        new URL(`/dashboard?slack_error=${encodeURIComponent(slackError)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?slack_error=missing_code', request.url))
    }

    // state から repository_id と user_id を分離
    const [repositoryId, userId] = (state ?? '').split(':')

    // ユーザーの OAuth 資格情報を優先、なければ環境変数
    let clientId = process.env.SLACK_CLIENT_ID!
    let clientSecret = process.env.SLACK_CLIENT_SECRET!
    const redirectUri = process.env.SLACK_REDIRECT_URI!

    if (userId) {
      const result = await query<{
        slack_client_id: string | null
        slack_client_secret_encrypted: string | null
      }>(
        'SELECT slack_client_id, slack_client_secret_encrypted FROM users WHERE id = $1',
        [userId]
      )
      const row = result.rows[0]
      if (row?.slack_client_id && row?.slack_client_secret_encrypted) {
        clientId = row.slack_client_id
        clientSecret = await decrypt(row.slack_client_secret_encrypted)
      }
    }

    const tokenData = await exchangeCode(code, clientId, clientSecret, redirectUri)
    console.log('[slack/callback] tokenData.ok:', tokenData.ok, 'team:', tokenData.team?.name)

    const encryptedToken = await encrypt(tokenData.access_token)

    if (repositoryId) {
      const { data: existing } = await supabaseAdmin
        .from('slack_integrations')
        .select('channel_id, channel_name')
        .eq('repository_id', repositoryId)
        .single()

      const { error: upsertError } = await supabaseAdmin.from('slack_integrations').upsert(
        {
          repository_id: repositoryId,
          workspace_id: tokenData.team.id,
          workspace_name: tokenData.team.name,
          channel_id: existing?.channel_id ?? '',
          channel_name: existing?.channel_name ?? '',
          access_token_encrypted: encryptedToken,
          is_active: !!(existing?.channel_id),
        },
        { onConflict: 'repository_id' }
      )
      if (upsertError) {
        console.error('[slack/callback] upsert error:', upsertError)
        return NextResponse.redirect(
          new URL(`/dashboard/repositories/${repositoryId}/slack?error=db_failed`, request.url)
        )
      }
    }

    const redirectPath = repositoryId
      ? `/dashboard/repositories/${repositoryId}/slack?connected=1`
      : '/dashboard'

    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (error) {
    console.error('Slack OAuth error:', error)
    const errMsg = error instanceof Error ? error.message : 'oauth_failed'
    const state = request.nextUrl.searchParams.get('state')
    const repositoryId = state?.split(':')[0]
    const dest = repositoryId
      ? `/dashboard/repositories/${repositoryId}/slack?error=${encodeURIComponent(errMsg)}`
      : `/dashboard?slack_error=${encodeURIComponent(errMsg)}`
    return NextResponse.redirect(new URL(dest, request.url))
  }
}
