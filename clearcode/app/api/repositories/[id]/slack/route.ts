import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
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
  const { channel_id, channel_name } = await req.json()

  if (!channel_id) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'channel_idが必要です' } }, { status: 400 })
  }

  // リポジトリの権限確認
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('slack_integrations')
    .update({ channel_id, channel_name, is_active: true })
    .eq('repository_id', id)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '更新に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('id')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  await supabaseAdmin.from('slack_integrations').delete().eq('repository_id', id)

  return NextResponse.json({ ok: true })
}
