import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  // ユーザーを削除（CASCADE で repositories・members 等も連鎖削除）
  await query('DELETE FROM users WHERE id = $1', [session.user_id])

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('session')
  return response
}
