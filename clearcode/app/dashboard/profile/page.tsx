'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types/database'
import GroqKeySettings from '@/components/GroqKeySettings'

type SlackMethod = 'oauth' | 'bottoken'

export default function ProfilePage() {
  const [user, setUser] = useState<Pick<User, 'id' | 'email' | 'name' | 'created_at'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [slackMethod, setSlackMethod] = useState<SlackMethod>('oauth')
  const [pendingMethod, setPendingMethod] = useState<SlackMethod>('oauth')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('slack_method') as SlackMethod | null
    if (stored) {
      setSlackMethod(stored)
      setPendingMethod(stored)
    }

    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user) })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = () => {
    setSlackMethod(pendingMethod)
    localStorage.setItem('slack_method', pendingMethod)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-center py-20 text-neutral-400">読み込み中...</div>

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">プロフィール</h1>
        <p className="text-sm text-gray-500 mt-1">アカウント情報と連携設定を確認できます</p>
      </div>

      {/* ユーザー情報 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">ユーザー情報</h2>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {[
            { label: '名前', value: user?.name ?? '—' },
            { label: 'メールアドレス', value: user?.email ?? '—' },
            { label: 'ユーザーID', value: user?.id ?? '—' },
            {
              label: '登録日',
              value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—',
            },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className={`flex items-start px-5 py-4 gap-4 ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-xs text-gray-400 w-28 pt-0.5 shrink-0">{label}</span>
              <span className="text-sm text-gray-800 font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Groq API キー */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Groq API キー</h2>
        <p className="text-xs text-gray-400 mb-3">設定すると要約生成のレート制限があなた専用になります</p>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <GroqKeySettings />
        </div>
      </section>

      {/* Slack連携方式 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Slack連携方式</h2>
        <p className="text-xs text-gray-400 mb-3">Slackの通知設定時に使用する連携方法を選択してください</p>
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* OAuth連携 */}
          <button
            onClick={() => setPendingMethod('oauth')}
            className={`w-full flex items-start gap-4 px-5 py-4 border-b border-gray-100 text-left transition-colors ${
              pendingMethod === 'oauth' ? 'bg-gray-50' : 'hover:bg-neutral-50'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              pendingMethod === 'oauth' ? 'border-gray-900' : 'border-gray-300'
            }`}>
              {pendingMethod === 'oauth' && <div className="w-2 h-2 rounded-full bg-gray-900" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">OAuth連携</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Slackの認可画面からワークスペースを選択して連携します。複数のワークスペースに対応できます。
              </p>
              <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                Manage Distribution の有効化が必要
              </span>
            </div>
          </button>

          {/* Bot Token連携 */}
          <button
            onClick={() => setPendingMethod('bottoken')}
            className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors ${
              pendingMethod === 'bottoken' ? 'bg-gray-50' : 'hover:bg-neutral-50'
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              pendingMethod === 'bottoken' ? 'border-gray-900' : 'border-gray-300'
            }`}>
              {pendingMethod === 'bottoken' && <div className="w-2 h-2 rounded-full bg-gray-900" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Bot Token連携</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                環境変数に設定した SLACK_BOT_TOKEN を使って直接連携します。認可画面が不要でシンプルです。
              </p>
              <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                1ワークスペース固定
              </span>
            </div>
          </button>
        </div>

        {/* 変更ボタン */}
        <div className="flex items-center justify-between mt-3">
          {pendingMethod === 'bottoken' && (
            <p className="text-xs text-gray-400 leading-relaxed">
              ⚠️ <code className="bg-gray-100 px-1 rounded">SLACK_BOT_TOKEN</code> が環境変数に必要です
            </p>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {saved && (
              <span className="text-xs text-gray-400">保存しました</span>
            )}
            <button
              onClick={handleSave}
              disabled={pendingMethod === slackMethod}
              className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              変更する
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
