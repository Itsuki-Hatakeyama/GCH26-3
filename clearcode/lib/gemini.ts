import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

export const gemini = {
  // コミットメッセージを平易化
  simplifyMessage: async (message: string): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `
あなたは技術用語を分かりやすく説明する専門家です。
以下のGitコミットメッセージを、プログラミング初心者でも理解できる日本語に翻訳してください。
専門用語は避け、何をしたのかを簡潔に説明してください。

コミットメッセージ: ${message}

翻訳:
`
    
    const result = await model.generateContent(prompt)
    return result.response.text()
  },
  
  // テスト用のシンプルな生成
  generate: async (prompt: string): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
  }
}