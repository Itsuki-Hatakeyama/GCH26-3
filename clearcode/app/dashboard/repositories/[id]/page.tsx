'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface CommitSummary {
  simplified_message: string
  code_explanation: string
  message_quality_score: number | null
  message_quality_feedback: string | null
}

interface Commit {
  id: string
  sha: string
  message: string
  author_name: string
  committed_at: string
  html_url: string
  commit_summaries: CommitSummary | null
}

interface Repository {
  id: string
  name: string
  full_name: string
  html_url: string
  slack_integration: { channel_name: string; is_active: boolean } | null
}

export default function RepositoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [repo, setRepo] = useState<Repository | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [unreadCommits, setUnreadCommits] = useState<Commit[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const syncCommits = useCallback(async () => {
    setSyncing(true)
    const res = await fetch(`/api/repositories/${id}/sync`, { method: 'POST' })
    if (!res.ok) console.error('sync failed', res.status, await res.text())
    await fetchCommits(1)
    setSyncing(false)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCommits = useCallback(async (p: number) => {
    const res = await fetch(`/api/repositories/${id}/commits?page=${p}`)
    if (!res.ok) {
      console.error('commits fetch failed', res.status, await res.text())
      return
    }
    const data = await res.json()
    if (p === 1) setCommits(data.commits ?? [])
    else setCommits((prev) => [...prev, ...(data.commits ?? [])])
    setHasMore((data.commits ?? []).length === 10)
  }, [id])

  useEffect(() => {
    const load = async () => {
      // 初回はGitHubから最新コミットを同期してから表示
      const syncRes = await fetch(`/api/repositories/${id}/sync`, { method: 'POST' })
      if (!syncRes.ok) {
        console.error('sync failed', syncRes.status, await syncRes.text())
      }

      const [repoRes, unreadRes] = await Promise.all([
        fetch(`/api/repositories/${id}`),
        fetch(`/api/repositories/${id}/commits?unread_only=true`),
      ])

      if (!repoRes.ok) {
        console.error('repo fetch failed', repoRes.status, await repoRes.text())
        setLoading(false)
        return
      }

      const [repoData, unreadData] = await Promise.all([
        repoRes.json(),
        unreadRes.ok ? unreadRes.json() : Promise.resolve({ commits: [] }),
      ])

      setRepo(repoData.repository)
      setUnreadCommits(unreadData.commits ?? [])
      await fetchCommits(1)
      setLoading(false)
    }

    load().catch((err) => {
      console.error('load error', err)
      setLoading(false)
    })

    // last_viewed_atを更新
    fetch(`/api/repositories/${id}/viewed`, { method: 'PATCH' })

    // 30秒ごとにポーリング
    const timer = setInterval(() => fetchCommits(1), 30000)
    return () => clearInterval(timer)
  }, [id, fetchCommits])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchCommits(next)
  }

  if (loading) return <div className="text-center py-20 text-neutral-400">読み込み中...</div>
  if (!repo) return <div className="text-center py-20 text-neutral-400">リポジトリが見つかりません</div>

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="text-xs text-neutral-400 mb-2">
          <Link href="/dashboard" className="hover:text-black">ホーム</Link> / {repo.name}
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-black">{repo.name}</h1>
            <p className="text-sm text-neutral-400">{repo.full_name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={syncCommits} disabled={syncing}>
              {syncing ? '同期中...' : '↻ 同期'}
            </Button>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">GitHubで見る</Button>
            </a>
            <Link href={`/dashboard/repositories/${id}/slack`}>
              <Button size="sm" variant={repo.slack_integration?.is_active ? 'outline' : 'default'}>
                {repo.slack_integration?.is_active ? '✓ Slack設定済み' : 'Slack連携'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 未読コミット */}
      {unreadCommits.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            前回閲覧後の新着 ({unreadCommits.length}件)
          </h2>
          <div className="space-y-3">
            {unreadCommits.map((c) => <CommitCard key={c.id} commit={c} repoId={id} isUnread />)}
          </div>
        </div>
      )}

      {/* 全コミット履歴 */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-500 mb-3">すべてのコミット履歴</h2>
        <div className="space-y-3">
          {commits.map((c) => <CommitCard key={c.id} commit={c} repoId={id} />)}
        </div>
        {hasMore && (
          <button onClick={loadMore} className="w-full mt-4 py-3 text-sm text-neutral-400 hover:text-black border border-neutral-100 rounded-xl hover:border-neutral-300 transition-colors">
            もっと見る
          </button>
        )}
      </div>
    </div>
  )
}

function CommitCard({ commit, repoId, isUnread }: { commit: Commit; repoId: string; isUnread?: boolean }) {
  const summary = commit.commit_summaries
  const date = new Date(commit.committed_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`bg-white rounded-xl border p-5 ${isUnread ? 'border-blue-200' : 'border-neutral-100'}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-black leading-snug flex-1 pr-4">
          {summary?.simplified_message ?? commit.message}
        </p>
        {summary?.message_quality_score != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
            summary.message_quality_score >= 70 ? 'bg-green-100 text-green-700' :
            summary.message_quality_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {summary.message_quality_score}点
          </span>
        )}
      </div>
      {summary?.code_explanation && (
        <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{summary.code_explanation}</p>
      )}
      <div className="flex justify-between items-center text-xs text-neutral-400">
        <span>{commit.author_name} · {date}</span>
        <Link href={`/dashboard/repositories/${repoId}/commits/${commit.sha}`} className="text-blue-500 hover:underline">
          詳細を見る
        </Link>
      </div>
    </div>
  )
}
