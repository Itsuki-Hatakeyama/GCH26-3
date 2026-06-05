'use client'

import { useEffect, useState } from 'react'
import { User } from '@/types/database'
import AiProviderSettings from '@/components/AiProviderSettings'
import { useTheme } from '@/components/ThemeProvider'
import { Moon, Sun } from 'lucide-react'

type SlackMethod = 'oauth' | 'bottoken'

export default function ProfilePage() {
  const [user, setUser] = useState<Pick<User, 'id' | 'email' | 'name' | 'created_at'> & {
    has_slack_bot_token?: boolean
    slack_client_id?: string | null
    has_slack_client_secret?: boolean
    github_client_id?: string | null
    has_github_client_secret?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [slackMethod, setSlackMethod] = useState<SlackMethod>('oauth')
  const [pendingMethod, setPendingMethod] = useState<SlackMethod>('oauth')
  const [saved, setSaved] = useState(false)
  const [slackToken, setSlackToken] = useState('')
  const [slackTokenSaving, setSlackTokenSaving] = useState(false)
  const [slackTokenSaved, setSlackTokenSaved] = useState(false)
  const [slackTokenError, setSlackTokenError] = useState<string | null>(null)
  const [githubClientId, setGithubClientId] = useState('')
  const [githubClientSecret, setGithubClientSecret] = useState('')
  const [githubSaving, setGithubSaving] = useState(false)
  const [githubSaved, setGithubSaved] = useState(false)
  const [githubError, setGithubError] = useState<string | null>(null)
  const [oauthClientId, setOauthClientId] = useState('')
  const [oauthClientSecret, setOauthClientSecret] = useState('')
  const [oauthSaving, setOauthSaving] = useState(false)
  const [oauthSaved, setOauthSaved] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const { theme, toggle } = useTheme()

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

  const saveSlackToken = async () => {
    setSlackTokenSaving(true)
    setSlackTokenError(null)
    try {
      const res = await fetch('/api/user/slack-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: slackToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSlackTokenError(data.error?.message ?? '保存に失敗しました')
        return
      }
      setUser((u) => u ? { ...u, has_slack_bot_token: true } : u)
      setSlackToken('')
      setSlackTokenSaved(true)
      setTimeout(() => setSlackTokenSaved(false), 2000)
    } finally {
      setSlackTokenSaving(false)
    }
  }

  const deleteSlackToken = async () => {
    if (!confirm('保存済みの Slack Bot Token を削除しますか？')) return
    await fetch('/api/user/slack-token', { method: 'DELETE' })
    setUser((u) => u ? { ...u, has_slack_bot_token: false } : u)
  }

  const saveOauthCredentials = async () => {
    setOauthSaving(true)
    setOauthError(null)
    try {
      const res = await fetch('/api/user/slack-oauth-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: oauthClientId, client_secret: oauthClientSecret }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOauthError(data.error?.message ?? '保存に失敗しました')
        return
      }
      setUser((u) => u ? { ...u, slack_client_id: oauthClientId, has_slack_client_secret: true } : u)
      setOauthClientId('')
      setOauthClientSecret('')
      setOauthSaved(true)
      setTimeout(() => setOauthSaved(false), 2000)
    } finally {
      setOauthSaving(false)
    }
  }

  const saveGithubCredentials = async () => {
    setGithubSaving(true)
    setGithubError(null)
    try {
      const res = await fetch('/api/user/github-credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: githubClientId, client_secret: githubClientSecret }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGithubError(data.error?.message ?? '保存に失敗しました')
        return
      }
      setUser((u) => u ? { ...u, github_client_id: githubClientId, has_github_client_secret: true } : u)
      setGithubClientId('')
      setGithubClientSecret('')
      setGithubSaved(true)
      setTimeout(() => setGithubSaved(false), 2000)
    } finally {
      setGithubSaving(false)
    }
  }

  const deleteGithubCredentials = async () => {
    if (!confirm('保存済みの GitHub OAuth 資格情報を削除しますか？')) return
    await fetch('/api/user/github-credentials', { method: 'DELETE' })
    setUser((u) => u ? { ...u, github_client_id: null, has_github_client_secret: false } : u)
  }

  const deleteOauthCredentials = async () => {
    if (!confirm('保存済みの OAuth 資格情報を削除しますか？')) return
    await fetch('/api/user/slack-oauth-credentials', { method: 'DELETE' })
    setUser((u) => u ? { ...u, slack_client_id: null, has_slack_client_secret: false } : u)
  }

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
        <h2 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-3">ユーザー情報</h2>
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl overflow-hidden">
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
              className={`flex items-start px-5 py-4 gap-4 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-neutral-800' : ''}`}
            >
              <span className="text-xs text-gray-400 dark:text-neutral-500 w-28 pt-0.5 shrink-0">{label}</span>
              <span className="text-sm text-gray-800 dark:text-neutral-200 font-mono break-all">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 表示モード */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-3">表示モード</h2>
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-neutral-400" />
            ) : (
              <Sun className="w-4 h-4 text-neutral-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-neutral-200">
                {theme === 'dark' ? 'ダークモード' : 'ライトモード'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">画面の明暗を切り替えます</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              theme === 'dark' ? 'bg-neutral-700' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>


      {/* GitHub OAuth 資格情報 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">GitHub OAuth 資格情報</h2>
        <p className="text-xs text-gray-400 mb-3">
          GitHub 連携に使用する Client ID と Client Secret を設定します。未設定の場合は管理者のデフォルト設定が使われます。
        </p>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          {user?.github_client_id && user?.has_github_client_secret && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">GitHub OAuth 資格情報 設定済み</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{user.github_client_id}</p>
              </div>
              <button
                onClick={deleteGithubCredentials}
                className="text-xs text-red-400 hover:text-red-600 underline"
              >
                削除する
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Client ID</label>
              <input
                type="text"
                placeholder="Ov23li..."
                value={githubClientId}
                onChange={(e) => { setGithubClientId(e.target.value); setGithubError(null) }}
                className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-neutral-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Client Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                value={githubClientSecret}
                onChange={(e) => { setGithubClientSecret(e.target.value); setGithubError(null) }}
                className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-neutral-400 font-mono"
              />
            </div>
          </div>

          {githubError && <p className="text-xs text-red-500">{githubError}</p>}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                github.com/settings/developers
              </a>{' '}
              で OAuth App を作成して取得できます
            </p>
            <div className="flex items-center gap-3">
              {githubSaved && <span className="text-xs text-gray-400">保存しました</span>}
              <button
                onClick={saveGithubCredentials}
                disabled={githubSaving || !githubClientId || !githubClientSecret}
                className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {githubSaving ? '保存中...' : user?.github_client_id ? '更新する' : '保存する'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">GitHub OAuth App の設定で必要な項目</p>
            <p>• Authorization callback URL に以下を登録：</p>
            <p className="font-mono bg-white border border-gray-200 rounded px-2 py-1 break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/github/callback
            </p>
          </div>
        </div>
      </section>

      {/* Groq API キー */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Groq API キー</h2>
        <p className="text-xs text-gray-400 mb-3">設定すると要約生成のレート制限があなた専用になります</p>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <AiProviderSettings />
        </div>
      </section>

      {/* Slack OAuth 資格情報 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Slack OAuth 資格情報</h2>
        <p className="text-xs text-gray-400 mb-3">
          OAuth 方式で連携するときに使用する Client ID と Client Secret を設定します。
        </p>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          {user?.slack_client_id && user?.has_slack_client_secret && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">OAuth 資格情報 設定済み</p>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">{user.slack_client_id}</p>
              </div>
              <button
                onClick={deleteOauthCredentials}
                className="text-xs text-red-400 hover:text-red-600 underline"
              >
                削除する
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Client ID</label>
              <input
                type="text"
                placeholder="1234567890.1234567890123"
                value={oauthClientId}
                onChange={(e) => { setOauthClientId(e.target.value); setOauthError(null) }}
                className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-neutral-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Client Secret</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={oauthClientSecret}
                onChange={(e) => { setOauthClientSecret(e.target.value); setOauthError(null) }}
                className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-neutral-400 font-mono"
              />
            </div>
          </div>

          {oauthError && <p className="text-xs text-red-500">{oauthError}</p>}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              <a
                href="https://api.slack.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                api.slack.com/apps
              </a>{' '}
              でアプリを作成して取得できます
            </p>
            <div className="flex items-center gap-3">
              {oauthSaved && <span className="text-xs text-gray-400">保存しました</span>}
              <button
                onClick={saveOauthCredentials}
                disabled={oauthSaving || !oauthClientId || !oauthClientSecret}
                className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {oauthSaving ? '保存中...' : user?.slack_client_id ? '更新する' : '保存する'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Slack アプリの設定で必要な項目</p>
            <p>• OAuth & Permissions → Redirect URLs に以下を追加：</p>
            <p className="font-mono bg-white border border-gray-200 rounded px-2 py-1 break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/slack/callback
            </p>
            <p>• Bot Token Scopes: <code className="bg-white border border-gray-200 rounded px-1">chat:write</code> <code className="bg-white border border-gray-200 rounded px-1">channels:read</code> <code className="bg-white border border-gray-200 rounded px-1">files:write</code></p>
          </div>
        </div>
      </section>

      {/* Slack Bot Token */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Slack Bot Token</h2>
        <p className="text-xs text-gray-400 mb-3">
          個人で作成した Slack アプリの Bot Token を設定します。Bot Token 方式で Slack 連携するときに使用されます。
        </p>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
          {user?.has_slack_bot_token ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Bot Token 設定済み</p>
                <p className="text-xs text-gray-400 mt-0.5">xoxb-••••••••••••</p>
              </div>
              <button
                onClick={deleteSlackToken}
                className="text-xs text-red-400 hover:text-red-600 underline"
              >
                削除する
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Bot Token が未設定です</p>
          )}

          <div className="space-y-2">
            <input
              type="password"
              placeholder="xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxx"
              value={slackToken}
              onChange={(e) => { setSlackToken(e.target.value); setSlackTokenError(null) }}
              className="w-full border border-neutral-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-neutral-400 font-mono"
            />
            {slackTokenError && (
              <p className="text-xs text-red-500">{slackTokenError}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                <a
                  href="https://api.slack.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  api.slack.com/apps
                </a>{' '}
                で Bot Token を取得できます
              </p>
              <div className="flex items-center gap-3">
                {slackTokenSaved && <span className="text-xs text-gray-400">保存しました</span>}
                <button
                  onClick={saveSlackToken}
                  disabled={slackTokenSaving || !slackToken}
                  className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {slackTokenSaving ? '保存中...' : user?.has_slack_bot_token ? '更新する' : '保存する'}
                </button>
              </div>
            </div>
          </div>
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
                上で設定した Slack Bot Token を使って直接連携します。認可画面が不要でシンプルです。
              </p>
              <span className="inline-block mt-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                1ワークスペース固定
              </span>
            </div>
          </button>
        </div>

        {/* 変更ボタン */}
        <div className="flex items-center justify-between mt-3">
          {pendingMethod === 'bottoken' && !user?.has_slack_bot_token && (
            <p className="text-xs text-orange-400 leading-relaxed">
              ⚠️ 上の「Slack Bot Token」セクションでトークンを設定してください
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

      {/* アカウント削除 */}
      <section>
        <h2 className="text-sm font-semibold text-red-500 mb-1">危険な操作</h2>
        <p className="text-xs text-gray-400 mb-3">この操作は取り消せません。慎重に行ってください。</p>
        <div className="bg-white border border-red-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">アカウントを削除する</p>
            <p className="text-xs text-gray-400 mt-0.5">登録したリポジトリや招待したメンバー情報もすべて削除されます</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。')) return
              if (!confirm('最終確認：すべてのデータが削除されます。実行しますか？')) return
              await fetch('/api/user/delete', { method: 'DELETE' })
              window.location.href = '/'
            }}
            className="text-sm font-medium text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            削除する
          </button>
        </div>
      </section>
    </div>
  )
}
