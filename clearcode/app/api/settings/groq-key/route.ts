import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('users')
    .select('groq_api_key_encrypted')
    .eq('id', session.user_id)
    .single()

  return NextResponse.json({ hasKey: !!data?.groq_api_key_encrypted })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { apiKey } = await req.json()
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return NextResponse.json({ error: 'APIキーを入力してください' }, { status: 400 })
  }

  const encrypted = await encrypt(apiKey.trim())
  const { error } = await supabaseAdmin
    .from('users')
    .update({ groq_api_key_encrypted: encrypted })
    .eq('id', session.user_id)

  if (error) {
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ groq_api_key_encrypted: null })
    .eq('id', session.user_id)

  if (error) {
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function getUserGroqApiKey(userId: string): Promise<string | undefined> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('groq_api_key_encrypted')
    .eq('id', userId)
    .single()

  if (!data?.groq_api_key_encrypted) return undefined
  return await decrypt(data.groq_api_key_encrypted)
}
