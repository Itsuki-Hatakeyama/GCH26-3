import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = req.nextUrl
  const page = parseInt(searchParams.get('page') ?? '1')
  const unreadOnly = searchParams.get('unread_only') === 'true'
  const limit = 10
  const offset = (page - 1) * limit

  // リポジトリの権限確認
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('last_viewed_at')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  let query = supabaseAdmin
    .from('commits')
    .select('*, commit_summaries(*)')
    .eq('repository_id', id)
    .order('committed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unreadOnly && repo.last_viewed_at) {
    query = query.gt('committed_at', repo.last_viewed_at)
  }

  const { data: commits, error: commitsError, count } = await query

  if (commitsError) {
    console.error('[commits] query error:', commitsError)
    return NextResponse.json({ error: { code: 'DB_ERROR', message: commitsError.message } }, { status: 500 })
  }

  console.log(`[commits] repo=${id} page=${page} found=${commits?.length ?? 0}`)

  return NextResponse.json({
    commits: commits ?? [],
    pagination: { page, limit, total: count ?? 0 },
  })
}
