'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface Channel {
  id: string
  name: string
  num_members: number
}

interface SlackIntegration {
  workspace_name: string
  channel_id: string
  channel_name: string
  is_active: boolean
}

export default function SlackContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [integration, setIntegration] = useState<SlackIntegration | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelSearch, setChannelSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/repositories/${id}/slack`)
      .then((r) => r.json())
      .then((d) => {
        if (d.integration?.workspace_name) {
          setIntegration(d.integration)
          return fetch(`/api/slack/channels?repository_id=${id}`)
            .then((r) => r.json())
            .then((cd) => setChannels(cd.channels ?? []))
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const selectChannel = async (channel: Channel) => {
    setSaving(true)
    const res = await fetch(`/api/repositories/${id}/slack`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channel.id, channel_name: `#${channel.name}` }),
    })
    setSaving(false)
    if (res.ok) {
      setIntegration((prev) =>
        prev ? { ...prev, channel_id: channel.id, channel_name: `#${channel.name}`, is_active: true } : prev
      )
      setSaved(true)
    }
  }

  const disconnect = async () => {
    if (!confirm('Slack連携を解除しますか？')) return
    await fetch(`/api/repositories/${id}/slack`, { method: 'DELETE' })
    setIntegration(null)
    setChannels([])
    setSaved(false)
  }

  const filtered = channels.filter((c) => c.name.includes(channelSearch.toLowerCase()))

  if (loading) return <div className="text-center py-20 text-neutral-400">読み込み中...</div>

  return (
    <div className="max-w-xl mx-auto">
      {/* パンくず */}
      <div className="text-xs text-neutral-400 mb-6">
        <Link href="/dashboard" className="hover:text-black">ホーム</Link>
        {' / '}
        <Link href={`/dashboard/repositories/${id}`} className="hover:text-black">リポジトリ</Link>
        {' / '}Slack連携
      </div>

      <h1 className="text-2xl font-semibold mb-2">Slack連携</h1>
      <p className="text-sm text-neutral-500 mb-8">このリポジトリの新しいコミットをSlackに通知します。</p>

      {/* チャンネル選択完了バナー */}
      {saved && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Slack連携が完了しました</p>
            <p className="text-xs text-green-600 mt-0.5">{integration?.channel_name} に通知します</p>
          </div>
          <Button
            size="sm"
            className="rounded-full text-xs shrink-0"
            onClick={() => router.push(`/dashboard/repositories/${id}`)}
          >
            リポジトリに戻る
          </Button>
        </div>
      )}

      {!integration ? (
        /* フェーズA: 未連携 */
        <div className="bg-white rounded-xl border border-neutral-100 p-8 text-center space-y-6">
          <div>
            <p className="text-sm text-neutral-600 mb-2">必要な権限</p>
            <ul className="text-xs text-neutral-400 space-y-1">
              <li>・チャンネルへのメッセージ投稿</li>
              <li>・チャンネル一覧の取得</li>
            </ul>
          </div>
          <a href={`/api/auth/slack/start?repository_id=${id}`}>
            <Button className="px-8">Slackで認証する</Button>
          </a>
          <div>
            <Link href={`/dashboard/repositories/${id}`}>
              <Button variant="outline" className="rounded-full text-xs">← リポジトリに戻る</Button>
            </Link>
          </div>
        </div>
      ) : integration.channel_id ? (
        /* フェーズC: 連携完了 */
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <p className="text-xs text-neutral-400 mb-1">連携中のワークスペース</p>
            <p className="font-medium text-black">{integration.workspace_name}</p>
            <p className="text-xs text-neutral-400 mt-3 mb-1">通知先チャンネル</p>
            <p className="font-medium text-black">{integration.channel_name}</p>
          </div>
          {!saved && (
            <p className="text-xs text-neutral-400 text-center">チャンネルを変更するには下から選択してください</p>
          )}
        </div>
      ) : (
        /* フェーズB: 連携済み・チャンネル未選択 */
        <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-4">
          <p className="text-sm font-medium text-neutral-800 mb-1">
            ワークスペース: <span className="text-black">{integration.workspace_name}</span>
          </p>
          <p className="text-xs text-neutral-400">通知先チャンネルを選択してください。</p>
        </div>
      )}

      {/* チャンネル選択 (フェーズB・C共通) */}
      {integration && channels.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold mb-3">チャンネルを選択</h2>
          <input
            type="text"
            placeholder="チャンネルを検索..."
            value={channelSearch}
            onChange={(e) => setChannelSearch(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm mb-3 outline-none focus:border-blue-400"
          />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch)}
                disabled={saving}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                  integration.channel_id === ch.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-neutral-100 hover:border-neutral-300'
                }`}
              >
                <span className="font-medium">#{ch.name}</span>
                <span className="text-xs text-neutral-400">{ch.num_members}人</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* フッターアクション */}
      <div className="mt-8 flex items-center justify-between">
        <Link href={`/dashboard/repositories/${id}`}>
          <Button variant="outline" className="rounded-full text-xs">← リポジトリに戻る</Button>
        </Link>
        {integration && (
          <button onClick={disconnect} className="text-xs text-red-400 hover:text-red-600 underline">
            Slack連携を解除する
          </button>
        )}
      </div>
    </div>
  )
}
