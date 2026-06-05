import Groq from 'groq-sdk'
import type { ChangeCategory } from '@/lib/prompts/categorize-change'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

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

function buildCombinedPrompt(commitMessage: string, diff: string): string {
  const diffSnippet = compressDiff(diff)
  return `あなたはGitコミットを分析する専門家です。以下のコミット情報を分析し、JSON形式のみで回答してください。

## コミットメッセージ
${commitMessage}

## コード差分
${diffSnippet || '(差分なし)'}

## 出力形式
以下のJSONのみを出力してください。余分なテキストや\`\`\`は不要です。

{
  "simplified_message": "プログラミング知識がない人向けに1〜2文で何をしたか説明",
  "code_explanation": "どのファイルで何が変わり、ユーザーや機能にどう影響するか2〜4文で説明",
  "quality_score": 75,
  "quality_feedback": "50文字以内のフィードバック",
  "categories": ["カテゴリ1"]
}

categoriesはフロントエンド/バックエンド/インフラ/テスト/ドキュメント/設定/リファクタリング/バグ修正から最大3つ選んでください。`
}

async function generate(prompt: string, retries = 2): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
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
    const raw = await generate(buildCombinedPrompt(commitMessage, diff))
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
