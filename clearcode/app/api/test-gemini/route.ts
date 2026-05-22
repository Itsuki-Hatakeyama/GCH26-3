import { gemini } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const testMessage = 'feat: add user authentication'
    const simplified = await gemini.generateText(`コミットメッセージを平易な日本語に変換: ${testMessage}`)
    
    return NextResponse.json({
      success: true,
      original: testMessage,
      simplified: simplified
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}