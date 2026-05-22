import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/slack'
import { encrypt } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state') // repository_id
    const slackError = request.nextUrl.searchParams.get('error')

    if (slackError) {
      return NextResponse.redirect(
        new URL(`/dashboard?slack_error=${encodeURIComponent(slackError)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?slack_error=missing_code', request.url))
    }

    const tokenData = await getAccessToken(code)
    const encryptedToken = await encrypt(tokenData.access_token)

    // slack_integrationsに保存（チャンネルは後で設定）
    if (state) {
      await supabaseAdmin.from('slack_integrations').upsert(
        {
          repository_id: state,
          workspace_id: tokenData.team.id,
          workspace_name: tokenData.team.name,
          channel_id: '',
          channel_name: '',
          access_token_encrypted: encryptedToken,
          is_active: false,
        },
        { onConflict: 'repository_id' }
      )
    }

    const redirectPath = state
      ? `/dashboard/repositories/${state}/slack?connected=1`
      : '/dashboard'

    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (error) {
    console.error('Slack OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard?slack_error=oauth_failed', request.url))
  }
}
