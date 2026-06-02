import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannels } from '@/lib/slack'
import { decrypt } from '@/lib/crypto'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const repositoryId = req.nextUrl.searchParams.get('repository_id')
  if (!repositoryId) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'repository_idが必要です' } }, { status: 400 })
  }

  const { data: integration } = await supabaseAdmin
    .from('slack_integrations')
    .select('access_token_encrypted')
    .eq('repository_id', repositoryId)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'Slack未連携です' } }, { status: 400 })
  }

  const accessToken = await decrypt(integration.access_token_encrypted)
  const allChannels = await getChannels(accessToken)
  const channels = allChannels
    .filter((c: Record<string, unknown>) => !c.is_private && !c.is_archived)
    .map((c: Record<string, unknown>) => ({ id: c.id, name: c.name, num_members: c.num_members ?? 0 }))

  return NextResponse.json({ channels })
}
