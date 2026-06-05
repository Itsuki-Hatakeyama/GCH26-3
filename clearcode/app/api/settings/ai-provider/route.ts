import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { encrypt } from '@/lib/crypto'
import { getUserAIConfig } from '@/lib/services/ai-config'
import type { AIProvider } from '@/lib/services/ai-config'

const VALID_PROVIDERS: AIProvider[] = ['groq', 'gemini', 'openai']

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const config = await getUserAIConfig(session.user_id)
  return NextResponse.json({ provider: config.provider, hasKey: !!config.apiKey })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { provider, apiKey } = await req.json()

  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: '無効なプロバイダーです' }, { status: 400 })
  }
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return NextResponse.json({ error: 'APIキーを入力してください' }, { status: 400 })
  }

  const encrypted = await encrypt(apiKey.trim())
  const { error } = await supabaseAdmin
    .from('users')
    .update({ ai_provider: provider, ai_api_key_encrypted: encrypted })
    .eq('id', session.user_id)

  if (error) return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('users')
    .update({ ai_api_key_encrypted: null, ai_provider: 'groq' })
    .eq('id', session.user_id)

  if (error) return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// 後方互換のため groq-key/route.ts から再エクスポートされる関数
export async function getUserGroqApiKey(userId: string): Promise<string | undefined> {
  const config = await getUserAIConfig(userId)
  return config.apiKey
}
