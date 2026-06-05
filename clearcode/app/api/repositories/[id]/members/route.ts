import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

async function getOwnerRepo(repoId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('repositories')
    .select('user_id')
    .eq('id', repoId)
    .single()
  return data?.user_id === userId ? data : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  // オーナーまたはアクティブメンバーなら閲覧可能
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  const isOwner = repo.user_id === session.user_id

  if (!isOwner) {
    const { data: membership } = await supabaseAdmin
      .from('repository_members')
      .select('id')
      .eq('repository_id', id)
      .eq('user_id', session.user_id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: '権限がありません' } }, { status: 403 })
    }
  }

  const { data: members } = await supabaseAdmin
    .from('repository_members')
    .select('id, email, role, status, invited_at, joined_at')
    .eq('repository_id', id)
    .order('invited_at', { ascending: true })

  return NextResponse.json({ members: members ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const owner = await getOwnerRepo(id, session.user_id)
  if (!owner) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '権限がありません' } }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: '有効なメールアドレスを入力してください' } }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  const { data: existing } = await supabaseAdmin
    .from('repository_members')
    .select('id')
    .eq('repository_id', id)
    .eq('email', normalized)
    .single()

  if (existing) {
    return NextResponse.json({ error: { code: 'ALREADY_MEMBER', message: 'すでに招待済みです' } }, { status: 409 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', normalized)
    .single()

  const { data: member, error } = await supabaseAdmin
    .from('repository_members')
    .insert({
      repository_id: id,
      user_id: user?.id ?? null,
      email: normalized,
      role: 'viewer',
      status: user ? 'active' : 'pending',
      invited_by: session.user_id,
      joined_at: user ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '招待に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ member }, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params
  const { member_id } = await req.json()

  if (!member_id) {
    return NextResponse.json({ error: { code: 'INVALID_REQUEST', message: 'member_idが必要です' } }, { status: 400 })
  }

  const owner = await getOwnerRepo(id, session.user_id)
  if (!owner) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: '権限がありません' } }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('repository_members')
    .delete()
    .eq('id', member_id)
    .eq('repository_id', id)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: '削除に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
