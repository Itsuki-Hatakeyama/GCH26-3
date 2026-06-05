import Groq from 'groq-sdk'
import type { ChangeCategory } from '@/lib/prompts/categorize-change'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

function compressDiff(diff: string): string {
  if (!diff) return ''

  const lines = diff.split('\n')

  // 変更ファイル名を先頭に列挙
  const fileNames = lines
    .filter((l) => l.startsWith('diff --git'))
    .map((l) => l.replace('diff --git a/', '').split(' b/')[0])
  const fileHeader = fileNames.length > 0 ? `変更ファイル: ${fileNames.join(', ')}\n\n` : ''

  if (diff.length <= 1000) return fileHeader + diff

  const extracted = lines
    .filter((l) =>
      l.startsWith('+') ||
      l.startsWith('-') ||
      l.startsWith('@@') ||
      l.startsWith('diff --git')
    )
    .join('\n')

  const body = extracted.length <= 2000 ? extracted : extracted.slice(0, 2000)
  return fileHeader + body
}

const SYSTEM_PROMPT = `You are a Git commit analyzer. You MUST respond with ONLY valid JSON — no markdown fences, no explanation, no extra text.
All string values must be in Japanese.

Output this exact JSON structure:
{
  "simplified_message": string,        // 1 sentence for anyone explaining what changed
  "explanation_simple": string,        // 2-3 sentences for non-programmers, no technical jargon at all
  "explanation_technical": string,     // 2-3 sentences for engineers with technical details
  "technical_terms": [{"term": string, "description": string}],  // 0-3 key technical terms explained in plain Japanese
  "quality_score": number,             // integer 0-100 rating commit message clarity (100 = perfect, 0 = useless)
  "quality_feedback": string,          // actionable improvement suggestion, 50 Japanese chars or less
  "categories": string[]               // 1-3 items from exactly: フロントエンド, バックエンド, インフラ, テスト, ドキュメント, 設定, リファクタリング, バグ修正
}

Example:
Input:
コミットメッセージ: fix login bug
差分:
変更ファイル: app/login/page.tsx
-  if (password.length < 6) return null
+  if (password.length < 8) return null

Output:
{"simplified_message":"ログインのパスワード条件を6文字から8文字に変更しました。","explanation_simple":"ログイン画面でパスワードが短すぎるときにエラーが出る条件を変更しました。以前は6文字以上でよかったのが、8文字以上が必要になりました。これによりアカウントがより安全になります。","explanation_technical":"app/login/page.tsxのパスワード長バリデーションの最小値を6文字から8文字に引き上げました。nullを返すearly returnパターンを維持しつつ、セキュリティポリシーを強化しています。","technical_terms":[{"term":"バリデーション","description":"入力された値が正しい形式かどうかチェックする処理"},{"term":"early return","description":"条件を満たさない場合に処理を早めに終了するコードの書き方"}],"quality_score":42,"quality_feedback":"何のバグか具体的に書くとよい（例：パスワード最小文字数を8文字に修正）","categories":["フロントエンド","バグ修正"]}`

function buildUserPrompt(commitMessage: string, diff: string): string {
  return `コミットメッセージ: ${commitMessage}

差分:
${compressDiff(diff) || '(差分なし)'}`
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
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: 'json_object' },
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
    const json = JSON.parse(raw)

    const terms = Array.isArray(json.technical_terms)
      ? json.technical_terms.slice(0, 3).map((t: { term?: string; description?: string }) => ({
          term: String(t.term ?? ''),
          description: String(t.description ?? ''),
        }))
      : []
    return {
      simplified_message: json.simplified_message ?? commitMessage,
      code_explanation: JSON.stringify({
        simple: json.explanation_simple ?? json.code_explanation ?? '',
        technical: json.explanation_technical ?? '',
        terms,
      }),
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
