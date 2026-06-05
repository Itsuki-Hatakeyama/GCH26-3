import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id } = await params

  // オーナーは退出できない
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('user_id')
    .eq('id', id)
    .single()

  if (repo?.user_id === session.user_id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'オーナーはリポジトリを退出できません' } },
      { status: 403 }
    )
  }

  const { error } = await supabaseAdmin
    .from('repository_members')
    .delete()
    .eq('repository_id', id)
    .eq('user_id', session.user_id)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
