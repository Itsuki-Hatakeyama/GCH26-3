import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'ログインが必要です' } }, { status: 401 })
  }

  const { id } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'リポジトリが見つかりません' } }, { status: 404 })
  }

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', session.user_id)
    .single()

  if (!integration) {
    return NextResponse.json({ error: { code: 'NOT_CONNECTED', message: 'GitHub未連携です' } }, { status: 400 })
  }

  const accessToken = await decrypt(integration.access_token_encrypted)
  const commits = await github.getCommits(accessToken, repo.owner, repo.name, 30)

  const rows = commits.map((c: {
    sha: string
    commit: { message: string; author: { name: string; email: string; date: string } }
    html_url: string
  }) => ({
    repository_id: id,
    sha: c.sha,
    message: c.commit.message,
    author_name: c.commit.author.name,
    author_email: c.commit.author.email,
    committed_at: c.commit.author.date,
    html_url: c.html_url,
  }))

  const { error } = await supabaseAdmin
    .from('commits')
    .upsert(rows, { onConflict: 'repository_id,sha' })

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'コミット保存に失敗しました' } }, { status: 500 })
  }

  return NextResponse.json({ synced: rows.length })
}
