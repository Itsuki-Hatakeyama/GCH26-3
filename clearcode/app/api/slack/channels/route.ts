import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { getChannels } from '@/lib/slack'
import { decrypt } from '@/lib/crypto'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const repositoryId = req.nextUrl.searchParams.get('repository_id')

  // Bot Tokenモード: ユーザーの保存済みトークン → 環境変数の順で使用
  if (!repositoryId) {
    const userResult = await query<{ slack_bot_token_encrypted: string | null }>(
      'SELECT slack_bot_token_encrypted FROM users WHERE id = $1',
      [session.user_id]
    )
    const userTokenEncrypted = userResult.rows[0]?.slack_bot_token_encrypted
    const botToken = userTokenEncrypted
      ? await decrypt(userTokenEncrypted)
      : process.env.SLACK_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json(
        { error: { code: 'TOKEN_MISSING', message: 'Slack Bot Tokenが設定されていません。プロフィールで設定してください。' } },
        { status: 400 }
      )
    }
    const allChannels = await getChannels(botToken)
    const channels = allChannels
      .filter((c: Record<string, unknown>) => !c.is_private && !c.is_archived)
      .map((c: Record<string, unknown>) => ({ id: c.id, name: c.name, num_members: c.num_members ?? 0 }))
    return NextResponse.json({ channels })
  }

  // OAuthモード: DBから暗号化トークンを取得して使用
  const { data: integration } = await supabaseAdmin
    .from('slack_integrations')
    .select('access_token_encrypted')
    .eq('repository_id', repositoryId)
    .single()

  console.log('[channels] integration:', integration ? 'found' : 'not found', 'token_len:', integration?.access_token_encrypted?.length)

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'Slack未連携です' } }, { status: 400 })
  }

  if (!integration.access_token_encrypted) {
    return NextResponse.json({ error: { code: 'TOKEN_MISSING' } }, { status: 400 })
  }

  const accessToken = await decrypt(integration.access_token_encrypted)
  console.log('[channels] token prefix:', accessToken.slice(0, 10))
  const allChannels = await getChannels(accessToken)
  console.log('[channels] total fetched:', allChannels.length)
  const channels = allChannels
    .filter((c: Record<string, unknown>) => !c.is_private && !c.is_archived)
    .map((c: Record<string, unknown>) => ({ id: c.id, name: c.name, num_members: c.num_members ?? 0 }))
  console.log('[channels] after filter:', channels.length)

  return NextResponse.json({ channels })
}
