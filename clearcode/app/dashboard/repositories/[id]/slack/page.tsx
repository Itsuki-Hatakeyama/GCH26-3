'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

interface Channel {
  id: string
  name: string
  num_members: number
}

interface SlackIntegration {
  channel_id: string
  channel_name: string
  is_active: boolean
}

function SlackPageContent() {
  const { id } = useParams<{ id: string }>()
  const [integration, setIntegration] = useState<SlackIntegration | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelSearch, setChannelSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/repositories/${id}/slack`).then((r) => r.json()),
      fetch(`/api/slack/channels`).then((r) => r.json()),
    ]).then(([slackData, channelData]) => {
      if (slackData.integration) setIntegration(slackData.integration)
      setChannels(channelData.channels ?? [])
    }).finally(() => setLoading(false))
  }, [id])

  const selectChannel = async (channel: Channel) => {
    setSaving(true)
    await fetch(`/api/repositories/${id}/slack`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: channel.id, channel_name: `#${channel.name}` }),
    })
    setIntegration({ channel_id: channel.id, channel_name: `#${channel.name}`, is_active: true })
    setSaving(false)
  }

  const disconnect = async () => {
    if (!confirm('Slack連携を解除しますか？')) return
    await fetch(`/api/repositories/${id}/slack`, { method: 'DELETE' })
    setIntegration(null)
  }

  const filtered = channels.filter((c) => c.name.includes(channelSearch.toLowerCase()))

  if (loading) return <div className="text-center py-20 text-neutral-400">読み込み中...</div>

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-xs text-neutral-400 mb-6">
        <Link href="/dashboard" className="hover:text-black">ホーム</Link>
        {' '}／{' '}
        <Link href={`/dashboard/repositories/${id}`} className="hover:text-black">リポジトリ</Link>
        {' '}／ Slack連携
      </div>
      <h1 className="text-xl font-semibold mb-1">Slack連携</h1>
      <p className="text-sm text-neutral-500 mb-8">通知を送るチャンネルを選択してください。</p>

      {integration?.channel_id && (
        <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-6">
          <p className="text-xs text-neutral-400 mb-1">現在の通知先チャンネル</p>
          <p className="font-medium text-black">{integration.channel_name}</p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold mb-3">チャンネルを選択</h2>
        <input
          type="text"
          placeholder="チャンネルを検索..."
          value={channelSearch}
          onChange={(e) => setChannelSearch(e.target.value)}
          className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm mb-3 outline-none focus:border-neutral-400"
        />
        {channels.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">チャンネルが取得できませんでした</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChannel(ch)}
                disabled={saving}
                className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                  integration?.channel_id === ch.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-neutral-100 hover:border-neutral-300'
                }`}
              >
                <span className="font-medium">#{ch.name}</span>
                <span className="text-xs text-neutral-400">{ch.num_members}人</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {integration && (
        <button onClick={disconnect} className="mt-8 text-xs text-red-400 hover:text-red-600 underline">
          Slack連携を解除する
        </button>
      )}
    </div>
  )
}

export default function SlackIntegrationPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">読み込み中...</div>}>
      <SlackPageContent />
    </Suspense>
  )
}
