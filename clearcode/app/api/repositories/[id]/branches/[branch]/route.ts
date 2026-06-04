import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; branch: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const { id, branch } = await params
  const branchName = decodeURIComponent(branch)

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('owner, name')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', session.user_id)
    .single()

  if (!integration) return NextResponse.json({ error: { code: 'NOT_CONNECTED' } }, { status: 400 })

  const accessToken = await decrypt(integration.access_token_encrypted)
  const raw = await github.getCommits(accessToken, repo.owner, repo.name, 15, branchName)

  const commits = (raw as {
    sha: string
    commit: { message: string; author: { name: string; date: string } }
    html_url: string
  }[]).map((c) => ({
    sha: c.sha,
    title: c.commit.message.split('\n')[0],
    author_name: c.commit.author.name,
    committed_at: c.commit.author.date,
    html_url: c.html_url,
  }))

  return NextResponse.json({ commits })
}
