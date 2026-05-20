import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { github } from '@/lib/github'
import { encrypt } from '@/lib/crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/connect-github?error=cancelled', req.url))
  }

  // GitHubからアクセストークン取得
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(new URL('/dashboard/connect-github?error=token_failed', req.url))
  }

  const accessToken: string = tokenData.access_token

  // GitHubユーザー情報取得
  const ghUser = await github.getUser(accessToken)
  const encryptedToken = await encrypt(accessToken)

  // github_integrationsにUPSERT
  await supabaseAdmin.from('github_integrations').upsert(
    {
      user_id: session.user_id,
      github_user_id: String(ghUser.id),
      github_username: ghUser.login,
      access_token_encrypted: encryptedToken,
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.redirect(new URL('/dashboard/connect-github', req.url))
}
