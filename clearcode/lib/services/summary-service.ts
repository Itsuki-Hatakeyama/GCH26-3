import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildSimplifyPrompt } from '@/lib/prompts/simplify-message'
import { buildExplainCodePrompt } from '@/lib/prompts/explain-code'
import { buildQualityScorePrompt } from '@/lib/prompts/quality-score'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const MODEL = 'gemini-2.0-flash'

async function generate(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: MODEL })
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}

export interface CommitSummary {
  simplified_message: string
  code_explanation: string
  message_quality_score: number
  message_quality_feedback: string
}

export async function generateSummary(
  commitMessage: string,
  diff: string
): Promise<CommitSummary> {
  const [simplified, explanation, qualityRaw] = await Promise.all([
    generate(buildSimplifyPrompt(commitMessage)),
    generate(buildExplainCodePrompt(diff, commitMessage)),
    generate(buildQualityScorePrompt(commitMessage)),
  ])

  let score = 50
  let feedback = 'コミットメッセージの品質を評価できませんでした'
  try {
    const json = JSON.parse(qualityRaw.replace(/```json|```/g, '').trim())
    score = Math.min(100, Math.max(0, Number(json.score) || 50))
    feedback = json.feedback || feedback
  } catch {
    // JSON parse失敗時はデフォルト値を使用
  }

  return {
    simplified_message: simplified,
    code_explanation: explanation,
    message_quality_score: score,
    message_quality_feedback: feedback,
  }
}
