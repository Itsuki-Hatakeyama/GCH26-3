import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'
import { generateSummary } from '@/lib/services/summary-service'

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

  console.log(`[sync] repo=${repo.owner}/${repo.name} commits_from_github=${commits.length}`)

  if (commits.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

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

  const { error, data: upserted } = await supabaseAdmin
    .from('commits')
    .upsert(rows, { onConflict: 'repository_id,sha' })
    .select('id')

  console.log(`[sync] upsert result: count=${upserted?.length ?? 0} error=${JSON.stringify(error)}`)

  if (error) {
    console.error('[sync] DB error:', error)
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'コミット保存に失敗しました', detail: error.message } }, { status: 500 })
  }

  // 要約が未生成のコミットを特定（2段階クエリ）
  const { data: recentCommits } = await supabaseAdmin
    .from('commits')
    .select('id, sha, message')
    .eq('repository_id', id)
    .order('committed_at', { ascending: false })
    .limit(10)

  let summaryCount = 0
  if (recentCommits && recentCommits.length > 0) {
    const commitIds = recentCommits.map((c) => c.id)
    const { data: existingSummaries } = await supabaseAdmin
      .from('commit_summaries')
      .select('commit_id')
      .in('commit_id', commitIds)

    const summarizedIds = new Set((existingSummaries ?? []).map((s) => s.commit_id))
    const unsummarized = recentCommits.filter((c) => !summarizedIds.has(c.id)).slice(0, 3)

    console.log(`[sync] unsummarized=${unsummarized.length}/${recentCommits.length}`)

    for (const commit of unsummarized) {
      console.log(`[sync] generating summary for sha=${commit.sha.slice(0, 7)}`)
      const diff = await github.getCommitDiff(accessToken, repo.owner, repo.name, commit.sha)
      const summary = await generateSummary(commit.message, diff)
      if (summary) {
        await supabaseAdmin.from('commit_summaries').upsert(
          {
            commit_id: commit.id,
            simplified_message: summary.simplified_message,
            code_explanation: summary.code_explanation,
            message_quality_score: summary.message_quality_score,
            message_quality_feedback: summary.message_quality_feedback,
            llm_model: 'gemini-2.0-flash',
          },
          { onConflict: 'commit_id' }
        )
        summaryCount++
        console.log(`[sync] summary saved for sha=${commit.sha.slice(0, 7)}`)
      } else {
        console.warn(`[sync] summary generation returned null for sha=${commit.sha.slice(0, 7)}`)
      }
    }
  }

  console.log(`[sync] done. summaries=${summaryCount}`)
  return NextResponse.json({ synced: rows.length, saved: upserted?.length ?? 0, summaries: summaryCount })
}
