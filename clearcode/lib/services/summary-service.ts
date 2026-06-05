import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ChangeCategory } from '@/lib/prompts/categorize-change'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-2.0-flash'

function compressDiff(diff: string): string {
  if (!diff || diff.length <= 1000) return diff

  // +/- 行とファイル・位置情報だけ抽出（コンテキスト行を除外）
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

  // それでも長い場合は2000文字で切る
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
  "quality_score": 0〜100の整数（何をしたか40点・なぜしたか30点・影響範囲30点で評価）,
  "quality_feedback": "50文字以内のフィードバック",
  "categories": ["カテゴリ1"] // フロントエンド/バックエンド/インフラ/テスト/ドキュメント/設定/リファクタリング/バグ修正 から最大3つ
}`
}

async function generate(prompt: string, retries = 3): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL })
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Gemini raw error]', msg)
      const is429 = msg.includes('429')

      if (is429 && (msg.includes('PerDay') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED'))) {
        throw new Error('QUOTA_EXCEEDED_DAILY')
      }

      if (is429 && i < retries - 1) {
        const match = msg.match(/retry in (\d+)/)
        const waitSec = match ? parseInt(match[1]) + 1 : 10
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        continue
      }
      throw err
    }
  }
  throw new Error('Gemini generate failed after retries')
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
      console.warn('Gemini日次クォータ超過。要約をスキップします。')
      return { error: 'QUOTA_EXCEEDED' }
    }
    if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('403')) {
      console.error('Gemini APIキーが無効です:', msg)
      return { error: 'AUTH_ERROR' }
    }
    console.error('Gemini要約生成エラー:', msg)
    return { error: 'UNKNOWN' }
  }
}
