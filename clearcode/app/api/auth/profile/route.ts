import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  // まず基本カラムを取得、追加カラムは別途試みる
  const baseResult = await query<{
    id: string
    email: string
    name: string
    created_at: string
  }>(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [session.user_id]
  )

  if (baseResult.rows.length === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const user = baseResult.rows[0]

  // 追加カラムはカラムが存在しない場合に備えて個別に取得
  let has_slack_bot_token = false
  let slack_client_id: string | null = null
  let has_slack_client_secret = false
  let github_client_id: string | null = null
  let has_github_client_secret = false

  try {
    const extResult = await query<{
      slack_bot_token_encrypted: string | null
      slack_client_id: string | null
      slack_client_secret_encrypted: string | null
      github_client_id: string | null
      github_client_secret_encrypted: string | null
    }>(
      `SELECT
        slack_bot_token_encrypted,
        slack_client_id,
        slack_client_secret_encrypted,
        github_client_id,
        github_client_secret_encrypted
       FROM users WHERE id = $1`,
      [session.user_id]
    )
    const ext = extResult.rows[0]
    if (ext) {
      has_slack_bot_token = !!ext.slack_bot_token_encrypted
      slack_client_id = ext.slack_client_id ?? null
      has_slack_client_secret = !!ext.slack_client_secret_encrypted
      github_client_id = ext.github_client_id ?? null
      has_github_client_secret = !!ext.github_client_secret_encrypted
    }
  } catch {
    // カラムが未追加の場合は無視してデフォルト値を使用
  }

  return NextResponse.json({
    user: {
      ...user,
      has_slack_bot_token,
      slack_client_id,
      has_slack_client_secret,
      github_client_id,
      has_github_client_secret,
    },
  })
}
