import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { encrypt } from '@/lib/crypto'

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { client_id, client_secret } = await req.json()

  if (!client_id || typeof client_id !== 'string') {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Client ID を入力してください' } },
      { status: 400 }
    )
  }
  if (!client_secret || typeof client_secret !== 'string') {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Client Secret を入力してください' } },
      { status: 400 }
    )
  }

  const encryptedSecret = await encrypt(client_secret)
  await query(
    'UPDATE users SET github_client_id = $1, github_client_secret_encrypted = $2 WHERE id = $3',
    [client_id, encryptedSecret, session.user_id]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  await query(
    'UPDATE users SET github_client_id = NULL, github_client_secret_encrypted = NULL WHERE id = $1',
    [session.user_id]
  )

  return NextResponse.json({ ok: true })
}
