import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildSimplifyPrompt } from '@/lib/prompts/simplify-message'
import { buildExplainCodePrompt } from '@/lib/prompts/explain-code'
import { buildQualityScorePrompt } from '@/lib/prompts/quality-score'
import { buildCategorizePrompt, type ChangeCategory } from '@/lib/prompts/categorize-change'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-1.5-flash'

// 429時にretryDelay分待ってリトライ（最大3回）
async function generate(prompt: string, retries = 3): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL })
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      const is429 = msg.includes('429')

      // 日次クォータ超過は即座に諦める（リトライしても無意味）
      if (is429 && msg.includes('FreeTier') && msg.includes('PerDay')) {
        throw new Error('QUOTA_EXCEEDED_DAILY')
      }

      if (is429 && i < retries - 1) {
        // エラーメッセージからretryDelay秒を取得（なければ10秒）
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

export async function generateSummary(
  commitMessage: string,
  diff: string
): Promise<CommitSummary | null> {
  try {
    // 順番に呼ぶ（並列だとレート制限に当たりやすい）
    const simplified = await generate(buildSimplifyPrompt(commitMessage))
    const explanation = await generate(buildExplainCodePrompt(diff, commitMessage))
    const qualityRaw = await generate(buildQualityScorePrompt(commitMessage))
    const categoriesRaw = await generate(buildCategorizePrompt(commitMessage, diff))

    let score = 50
    let feedback = 'コミットメッセージの品質を評価できませんでした'
    try {
      const json = JSON.parse(qualityRaw.replace(/```json|```/g, '').trim())
      score = Math.min(100, Math.max(0, Number(json.score) || 50))
      feedback = json.feedback || feedback
    } catch {
      // JSON parse失敗時はデフォルト値
    }

    let change_categories: ChangeCategory[] = []
    try {
      const json = JSON.parse(categoriesRaw.replace(/```json|```/g, '').trim())
      if (Array.isArray(json.categories)) {
        change_categories = json.categories.slice(0, 3) as ChangeCategory[]
      }
    } catch {
      // JSON parse失敗時は空配列
    }

    return {
      simplified_message: simplified,
      code_explanation: explanation,
      message_quality_score: score,
      message_quality_feedback: feedback,
      change_categories,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'QUOTA_EXCEEDED_DAILY') {
      console.warn('Gemini日次クォータ超過。要約をスキップします。')
      return null
    }
    console.error('Gemini要約生成エラー:', msg)
    return null
  }
}
