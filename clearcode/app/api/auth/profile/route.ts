import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const result = await query<{ id: string; email: string; name: string; created_at: string }>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [session.user_id]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  return NextResponse.json({ user: result.rows[0] })
}
