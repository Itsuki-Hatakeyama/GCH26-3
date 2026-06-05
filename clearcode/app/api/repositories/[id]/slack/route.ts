import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function checkAccess(id: string, userId: string): Promise<boolean> {
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!repo) return false
  if (repo.user_id === userId) return true

  const { data: membership } = await supabaseAdmin
    .from('repository_members')
    .select('id')
    .eq('repository_id', id)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  return !!membership
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id } = await params

  if (!(await checkAccess(id, session.user_id))) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const { data: integration } = await supabaseAdmin
    .from('slack_integrations')
    .select('workspace_id, workspace_name, channel_id, channel_name, is_active')
    .eq('repository_id', id)
    .single()

  return NextResponse.json({ integration: integration ?? null })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { channel_id, channel_name, method } = body
  console.log('[slack PUT]', { id, channel_id, channel_name, method })

  if (!channel_id) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'channel_idが必要です' } }, { status: 400 })
  }

  if (!(await checkAccess(id, session.user_id))) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  if (method === 'bottoken') {
    const { error } = await supabaseAdmin
      .from('slack_integrations')
      .upsert(
        {
          repository_id: id,
          workspace_id: 'bottoken',
          workspace_name: 'Bot Token',
          channel_id,
          channel_name,
          access_token_encrypted: '',
          is_active: true,
        },
        { onConflict: 'repository_id' }
      )
    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: '更新に失敗しました' } }, { status: 500 })
    }
  } else {
    const { error } = await supabaseAdmin
      .from('slack_integrations')
      .update({ channel_id, channel_name, is_active: true })
      .eq('repository_id', id)
    if (error) {
      return NextResponse.json({ error: { code: 'DB_ERROR', message: '更新に失敗しました' } }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  if (!(await checkAccess(id, session.user_id))) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  await supabaseAdmin.from('slack_integrations').delete().eq('repository_id', id)

  return NextResponse.json({ ok: true })
}
