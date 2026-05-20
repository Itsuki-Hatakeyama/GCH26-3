'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'

interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  updated_at: string
}

function ConnectGithubContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('error') === 'cancelled') {
      setError('GitHub認証がキャンセルされました')
      return
    }
    // GitHub連携済みかチェック
    fetch('/api/github/repositories')
      .then((r) => r.json())
      .then((d) => {
        if (d.repos) {
          setRepos(d.repos)
          setConnected(true)
        }
      })
      .catch(() => {})
  }, [searchParams])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (data.repositories) {
        router.push('/dashboard')
      }
    } finally {
      setSaving(false)
    }
  }

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (!connected) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">GitHubと連携する</h1>
        <p className="text-neutral-500 text-sm mb-8">
          リポジトリのコミットを自動で要約し、Slackに通知します。
          <br />読み取り権限のみ要求します。アクセストークンは暗号化して保存します。
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <a href="/api/auth/github/start">
          <Button className="px-8">GitHubで認証する</Button>
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">監視するリポジトリを選択</h1>
        <Button onClick={handleAdd} disabled={selected.size === 0 || saving}>
          {saving ? '追加中...' : `選択したリポジトリを追加 (${selected.size})`}
        </Button>
      </div>
      <input
        type="text"
        placeholder="リポジトリを検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm mb-4 outline-none focus:border-blue-400"
      />
      <div className="space-y-2">
        {filtered.map((repo) => (
          <label
            key={repo.id}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              selected.has(String(repo.id))
                ? 'border-blue-400 bg-blue-50'
                : 'border-neutral-100 bg-white hover:border-neutral-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(String(repo.id))}
              onChange={() => toggleSelect(String(repo.id))}
              className="accent-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-black">{repo.name}</span>
                {repo.private && (
                  <span className="text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">private</span>
                )}
              </div>
              <p className="text-xs text-neutral-400 truncate">{repo.full_name}</p>
              {repo.description && <p className="text-xs text-neutral-500 mt-0.5 truncate">{repo.description}</p>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function ConnectGithubPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">読み込み中...</div>}>
      <ConnectGithubContent />
    </Suspense>
  )
}
