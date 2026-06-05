import { supabaseAdmin } from '@/lib/supabase'
import { github } from '@/lib/github'
import { decrypt } from '@/lib/crypto'
import { generateSummary } from '@/lib/services/summary-service'
import { sendCommitNotification } from '@/lib/services/notification-service'

interface RawCommit {
  id: string
  sha: string
  message: string
  author: { name: string; email: string }
  timestamp: string
  url: string
}

export async function processCommit(repositoryId: string, rawCommit: RawCommit): Promise<void> {
  // リポジトリ情報取得
  const { data: repo } = await supabaseAdmin
    .from('repositories')
    .select('*, users!inner(id)')
    .eq('id', repositoryId)
    .single()
  if (!repo) return

  // GitHub連携情報取得
  const { data: ghIntegration } = await supabaseAdmin
    .from('github_integrations')
    .select('access_token_encrypted')
    .eq('user_id', repo.user_id)
    .single()
  if (!ghIntegration) return

  const accessToken = await decrypt(ghIntegration.access_token_encrypted)

  // commitsテーブルに保存（重複は無視）
  const { data: commit, error: insertError } = await supabaseAdmin
    .from('commits')
    .upsert(
      {
        repository_id: repositoryId,
        sha: rawCommit.sha,
        message: rawCommit.message,
        author_name: rawCommit.author.name,
        author_email: rawCommit.author.email,
        committed_at: rawCommit.timestamp,
        html_url: rawCommit.url,
      },
      { onConflict: 'repository_id,sha' }
    )
    .select()
    .single()

  if (insertError || !commit) return

  // diff取得 + Gemini要約（クォータ超過時はnull）
  const diff = await github.getCommitDiff(accessToken, repo.owner, repo.name, rawCommit.sha)
  const summaryResult = await generateSummary(rawCommit.message, diff)
  const summary = summaryResult && !('error' in summaryResult) ? summaryResult : null

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
  }

  // Slack通知
  const { data: slackIntegration } = await supabaseAdmin
    .from('slack_integrations')
    .select('*')
    .eq('repository_id', repositoryId)
    .eq('is_active', true)
    .single()

  if (slackIntegration?.channel_id) {
    const simplifiedMessage = summary?.simplified_message ?? rawCommit.message
    const codeExplanation = summary?.code_explanation ?? '（要約生成中）'
    await sendCommitNotification({
      accessTokenEncrypted: slackIntegration.access_token_encrypted,
      channelId: slackIntegration.channel_id,
      repoName: repo.name,
      commitSha: rawCommit.sha,
      authorName: rawCommit.author.name,
      simplifiedMessage,
      codeExplanation,
      commitUrl: rawCommit.url,
      diff: diff || undefined,
    })
  }
}
