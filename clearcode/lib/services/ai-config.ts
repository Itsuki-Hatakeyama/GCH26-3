import { supabaseAdmin } from '@/lib/supabase'
import { decrypt } from '@/lib/crypto'

export type AIProvider = 'groq' | 'gemini' | 'openai'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
}

export async function getUserAIConfig(userId: string): Promise<AIConfig> {
  const { data } = await supabaseAdmin
    .from('users')
    .select('ai_provider, ai_api_key_encrypted')
    .eq('id', userId)
    .single()

  const provider = (data?.ai_provider as AIProvider | null) ?? 'groq'
  const apiKey = data?.ai_api_key_encrypted
    ? await decrypt(data.ai_api_key_encrypted)
    : undefined

  return { provider, apiKey }
}
