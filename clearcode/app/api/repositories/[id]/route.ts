import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  // Slack連携状態を確認
  const { data: slack } = await supabaseAdmin
    .from('slack_integrations')
    .select('channel_name, workspace_name, is_active')
    .eq('repository_id', id)
    .single()

  return NextResponse.json({ repository: { ...repo, slack_integration: slack ?? null } })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('repositories')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user_id)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '削除に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
