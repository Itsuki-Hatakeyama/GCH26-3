import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { encrypt } from '@/lib/crypto'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { token } = await req.json()
  if (!token || typeof token !== 'string' || !token.startsWith('xoxb-')) {
    return NextResponse.json(
      { error: { code: 'INVALID_TOKEN', message: 'xoxb- で始まる Bot Token を入力してください' } },
      { status: 400 }
    )
  }

  const encrypted = await encrypt(token)
  await query(
    'UPDATE users SET slack_bot_token_encrypted = $1 WHERE id = $2',
    [encrypted, session.user_id]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  await query(
    'UPDATE users SET slack_bot_token_encrypted = NULL WHERE id = $1',
    [session.user_id]
  )

  return NextResponse.json({ ok: true })
}
