import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { processCommit } from '@/lib/services/commit-service'

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret || secret === 'openssl rand -hex 32') return true // 開発環境

  const signature = req.headers.get('x-hub-signature-256')
  if (!signature) return false

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = 'sha256=' + Buffer.from(mac).toString('hex')
  return signature === expected
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!await verifySignature(req, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = req.headers.get('x-github-event')
  if (event !== 'push') {
    return NextResponse.json({ ok: true })
  }

  const payload = JSON.parse(body)
  const repoGithubId = String(payload.repository?.id)

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('id')
    .eq('github_repo_id', repoGithubId)
    .single()

  if (!repo) {
    return NextResponse.json({ ok: true })
  }

  // 即座に200を返してからバックグラウンド処理
  const commits: Array<{
    id: string
    message: string
    author: { name: string; email: string }
    timestamp: string
    url: string
  }> = payload.commits ?? []

  // waitUntilが使えない環境向けにsetTimeoutで非同期処理
  Promise.all(
    commits.map((c) =>
      processCommit(repo.id, {
        id: c.id,
        sha: c.id,
        message: c.message,
        author: c.author,
        timestamp: c.timestamp,
        url: c.url,
      })
    )
  ).catch(console.error)

  return NextResponse.json({ ok: true })
}
