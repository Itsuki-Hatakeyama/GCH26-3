'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

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

function SlackPageContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [integration, setIntegration] = useState<SlackIntegration | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelSearch, setChannelSearch] = useState('')
  const [selected, setSelected] = useState<Channel | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/repositories/${id}/slack`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d.integration) {
          setIntegration(d.integration)
          const cd = await fetch(`/api/slack/channels?repository_id=${id}`).then((r) => r.json())
          setChannels(cd.channels ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [id, searchParams])

  const confirmChannel = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/repositories/${id}/slack`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel_id: selected.id, channel_name: `#${selected.name}` }),
    })
    router.push(`/dashboard/repositories/${id}`)
  }

  const disconnect = async () => {
    if (!confirm('Slack連携を解除しますか？')) return
    await fetch(`/api/repositories/${id}/slack`, { method: 'DELETE' })
    setIntegration(null)
    setChannels([])
    setSelected(null)
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
      <p className="text-sm text-neutral-500 mb-8">通知を送るワークスペースとチャンネルを設定してください。</p>

      {!integration ? (
        /* Phase A: 未連携 → ワークスペース選択 */
        <div className="bg-white rounded-xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-600 mb-2">Slackワークスペースを連携する</p>
          <p className="text-xs text-neutral-400 mb-8 leading-relaxed">
            ボタンを押すとSlackの認可画面が開きます。<br />
            連携したいワークスペースを選択してください。
          </p>
          <a href={`/api/auth/slack/start?repository_id=${id}`}>
            <button className="bg-gray-900 text-white text-sm font-medium px-8 py-2.5 rounded-lg hover:bg-gray-700 transition-colors">
              Slackと連携する
            </button>
          </a>
        </div>
      ) : (
        /* Phase B / C: 連携済み */
        <>
          <div className="bg-white rounded-xl border border-neutral-100 p-5 mb-6">
            <p className="text-xs text-neutral-400 mb-1">連携中のワークスペース</p>
            <p className="font-medium text-black">{integration.workspace_name}</p>
            {integration.channel_id && (
              <>
                <p className="text-xs text-neutral-400 mt-3 mb-1">現在の通知先チャンネル</p>
                <p className="font-medium text-black">{integration.channel_name}</p>
              </>
            )}
          </div>

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
                    onClick={() => setSelected(ch)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                      selected?.id === ch.id
                        ? 'border-gray-900 bg-gray-50'
                        : integration.channel_id === ch.id
                        ? 'border-neutral-300 bg-neutral-50'
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

          {selected && (
            <div className="mt-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 mb-0.5">選択中</p>
                <p className="text-sm font-medium text-black">#{selected.name}</p>
              </div>
              <button
                onClick={confirmChannel}
                disabled={saving}
                className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '選択する'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between">
            <a
              href={`/api/auth/slack/start?repository_id=${id}`}
              className="text-xs text-neutral-400 hover:text-black transition-colors"
            >
              別のワークスペースに変更する →
            </a>
            <button onClick={disconnect} className="text-xs text-red-400 hover:text-red-600 underline">
              連携を解除する
            </button>
          </div>
        </>
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
