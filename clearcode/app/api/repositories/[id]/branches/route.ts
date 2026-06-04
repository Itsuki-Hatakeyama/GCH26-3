import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })

  const { id } = await params

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
  const raw = await github.getBranches(accessToken, repo.owner, repo.name)

  const branches = (raw as { name: string; commit: { sha: string } }[]).map((b) => ({
    name: b.name,
    lastCommitSha: b.commit.sha,
  }))

  return NextResponse.json({ branches })
}
