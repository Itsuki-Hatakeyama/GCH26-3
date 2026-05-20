import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { data: commit } = await supabaseAdmin
    .from('commits')
    .select('*, commit_summaries(*), repositories!inner(user_id, name, full_name)')
    .eq('id', id)
    .single()

  if (!commit || commit.repositories.user_id !== session.user_id) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'コミットが見つかりません' } }, { status: 404 })
  }

  return NextResponse.json({ commit })
}
