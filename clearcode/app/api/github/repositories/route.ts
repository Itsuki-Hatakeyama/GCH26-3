import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted, github_username')
    .eq('user_id', session.user_id)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'GitHub未連携です' } }, { status: 400 })
  }

  const accessToken = await decrypt(integration.access_token_encrypted)
  const repos = await github.getRepositories(accessToken)

  return NextResponse.json({ repositories: repos, github_username: integration.github_username })
}
