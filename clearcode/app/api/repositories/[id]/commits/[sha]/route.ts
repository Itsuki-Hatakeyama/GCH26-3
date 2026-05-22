import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sha: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { id, sha } = await params

  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user_id)
    .single()

  if (!repo) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const { data: commit } = await supabaseAdmin
    .from('commits')
    .select('*, commit_summaries(*)')
    .eq('repository_id', id)
    .eq('sha', sha)
    .single()

  if (!commit) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  const { data: integration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', session.user_id)
    .single()

  let diff = ''
  if (integration) {
    try {
      const accessToken = await decrypt(integration.access_token_encrypted)
      diff = await github.getCommitDiff(accessToken, repo.owner, repo.name, sha)
    } catch {
      // diff取得失敗時は空文字のまま（コミット情報は返す）
    }
  }

  return NextResponse.json({ commit, diff, repo: { name: repo.name, full_name: repo.full_name } })
}
