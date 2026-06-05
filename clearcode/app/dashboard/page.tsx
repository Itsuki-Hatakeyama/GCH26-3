'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  is_private: boolean
  unread_count: number
  updated_at: string
  slack_integration?: { channel_name: string; is_active: boolean } | null
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/repositories')
      .then((r) => r.json())
      .then((d) => setRepos(d.repositories ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, repoId: string, repoName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`「${repoName}」を削除しますか？\nコミット履歴や要約データもすべて削除されます。`)) return
    setDeletingId(repoId)
    try {
      const res = await fetch(`/api/repositories/${repoId}`, { method: 'DELETE' })
      if (res.ok) {
        setRepos((prev) => prev.filter((r) => r.id !== repoId))
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">リポジトリ</h1>
          <p className="text-sm text-neutral-400 mt-1">連携中のGitHubリポジトリ一覧</p>
        </div>
        <Link href="/dashboard/connect-github">
          <Button className="rounded-full px-5 text-sm">+ 追加</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-400">読み込み中...</div>
      ) : repos.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-100 p-16 text-center">
          <p className="text-sm font-medium text-black mb-1">リポジトリがありません</p>
          <p className="text-xs text-neutral-400 mb-6">GitHubと連携してコミットの翻訳を始めましょう</p>
          <Link href="/dashboard/connect-github">
            <Button variant="outline" className="rounded-full px-6 text-sm">GitHubと連携する</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <Link key={repo.id} href={`/dashboard/repositories/${repo.id}`}>
              <div className="relative bg-white rounded-xl border border-neutral-100 p-5 hover:border-neutral-300 transition-colors cursor-pointer h-full group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-black text-sm truncate max-w-[180px]">{repo.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {repo.is_private && (
                      <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">private</span>
                    )}
                    {repo.unread_count > 0 && (
                      <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full font-medium">
                        {repo.unread_count}
                      </span>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, repo.id, repo.name)}
                      disabled={deletingId === repo.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-neutral-300 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mb-3 truncate">{repo.full_name}</p>
                {repo.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2 mb-3">{repo.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs">
                  {repo.slack_integration?.is_active ? (
                    <span className="text-green-600">✓ Slack連携済み ({repo.slack_integration.channel_name})</span>
                  ) : (
                    <span className="text-amber-500">⚠ Slack未設定</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
