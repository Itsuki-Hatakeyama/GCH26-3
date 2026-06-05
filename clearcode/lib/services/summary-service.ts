import Groq from 'groq-sdk'
import type { ChangeCategory } from '@/lib/prompts/categorize-change'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.1-8b-instant'

function compressDiff(diff: string): string {
  if (!diff || diff.length <= 1000) return diff

  const extracted = diff
    .split('\n')
    .filter((line) =>
      line.startsWith('+') ||
      line.startsWith('-') ||
      line.startsWith('@@') ||
      line.startsWith('diff --git')
    )
    .join('\n')

  if (extracted.length <= 2000) return extracted
  return extracted.slice(0, 2000)
}

const SYSTEM_PROMPT = `You are a Git commit analyzer. Respond with ONLY valid JSON — no markdown fences, no explanation.
All string values must be in Japanese.

Output this exact structure:
{
  "simplified_message": string,  // 1-2 sentences for non-programmers
  "code_explanation": string,    // 2-4 sentences on which files changed and user/feature impact
  "quality_score": number,       // 0-100 integer rating commit message clarity
  "quality_feedback": string,    // actionable feedback on the commit message, 50 chars or less
  "categories": string[]         // 1-3 items from: フロントエンド, バックエンド, インフラ, テスト, ドキュメント, 設定, リファクタリング, バグ修正
}`

function buildUserPrompt(commitMessage: string, diff: string): string {
  const diffSnippet = compressDiff(diff)
  return `コミットメッセージ: ${commitMessage}

差分:
${diffSnippet || '(差分なし)'}`
}

async function generate(userPrompt: string, retries = 2): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
      })
      return result.choices[0].message.content?.trim() ?? ''
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Groq raw error]', msg)

      if (msg.includes('429') || msg.includes('rate_limit')) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 10_000))
          continue
        }
        throw new Error('QUOTA_EXCEEDED_DAILY')
      }
      throw err
    }
  }
  throw new Error('Groq generate failed after retries')
}

export interface CommitSummary {
  simplified_message: string
  code_explanation: string
  message_quality_score: number
  message_quality_feedback: string
  change_categories: ChangeCategory[]
}

export type SummaryError = 'QUOTA_EXCEEDED' | 'AUTH_ERROR' | 'UNKNOWN'

export async function generateSummary(
  commitMessage: string,
  diff: string
): Promise<CommitSummary | { error: SummaryError } | null> {
  try {
    const raw = await generate(buildUserPrompt(commitMessage, diff))
    const json = JSON.parse(raw.replace(/```json|```/g, '').trim())

    return {
      simplified_message: json.simplified_message ?? commitMessage,
      code_explanation: json.code_explanation ?? '',
      message_quality_score: Math.min(100, Math.max(0, Number(json.quality_score) || 50)),
      message_quality_feedback: json.quality_feedback ?? '',
      change_categories: Array.isArray(json.categories) ? json.categories.slice(0, 3) as ChangeCategory[] : [],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'QUOTA_EXCEEDED_DAILY') {
      console.warn('Groqレート制限。要約をスキップします。')
      return { error: 'QUOTA_EXCEEDED' }
    }
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      console.error('Groq APIキーが無効です:', msg)
      return { error: 'AUTH_ERROR' }
    }
    console.error('Groq要約生成エラー:', msg)
    return { error: 'UNKNOWN' }
  }
}
