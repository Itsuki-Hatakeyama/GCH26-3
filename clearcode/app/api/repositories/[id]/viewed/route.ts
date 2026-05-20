import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('repositories')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.user_id)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '更新に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
