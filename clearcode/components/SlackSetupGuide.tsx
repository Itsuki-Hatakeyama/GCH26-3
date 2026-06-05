'use client'

import { useState } from 'react'

export default function SlackSetupGuide() {
  const [tab, setTab] = useState<'manifest' | 'manual'>('manifest')

  return (
    <div>
      {/* タブ切り替え */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('manifest')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === 'manifest'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-800'
          }`}
        >
          マニフェストで一括設定（簡単）
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tab === 'manual'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:text-gray-800'
          }`}
        >
          手動で設定
        </button>
      </div>

      {tab === 'manifest' ? (
        <ol className="space-y-6">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">1</span>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-800">Slack App 作成画面を開く</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a> を開く</li>
                <li>② 右上の「<strong className="text-gray-700">Create New App</strong>」をクリック</li>
                <li>③「<strong className="text-gray-700">From a manifest</strong>」を選択</li>
                <li>④ ワークスペースを選択して「<strong className="text-gray-700">Next</strong>」をクリック</li>
              </ol>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">2</span>
            <div className="space-y-2 w-full">
              <p className="text-sm font-medium text-gray-800">マニフェストを貼り付ける</p>
              <p className="text-sm text-gray-500">「YAML」タブを選択し、以下をそのまま貼り付けてください。</p>
              <div className="bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed whitespace-pre">{`display_information:
  name: Clearcode
features:
  bot_user:
    display_name: Clearcode
    always_online: false
oauth_config:
  redirect_urls:
    - http://localhost:3001/api/auth/slack/callback
    - https://あなたのドメイン.vercel.app/api/auth/slack/callback
  scopes:
    bot:
      - channels:read
      - chat:write
      - chat:write.public
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false`}</div>
              <p className="text-xs text-gray-400">貼り付け後「<strong className="text-gray-700">Next</strong>」→「<strong className="text-gray-700">Create</strong>」をクリック</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">3</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Client ID / Client Secret を取得して環境変数に登録する</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① 左サイドバーの「<strong className="text-gray-700">Basic Information</strong>」をクリック</li>
                <li>②「<strong className="text-gray-700">App Credentials</strong>」で Client ID と Client Secret を確認</li>
                <li>③ Vercel の <strong className="text-gray-700">Project → Settings → Environment Variables</strong> に追加</li>
              </ol>
              <div className="mt-1 bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed">
                SLACK_CLIENT_ID=<span className="text-yellow-300">取得したClient ID</span><br />
                SLACK_CLIENT_SECRET=<span className="text-yellow-300">取得したClient Secret</span><br />
                SLACK_REDIRECT_URI=<span className="text-yellow-300">https://あなたのドメイン.vercel.app/api/auth/slack/callback</span>
              </div>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">4</span>
            <div>
              <p className="text-sm font-medium text-gray-800">リポジトリのSlack設定ページで連携する</p>
              <ol className="text-sm text-gray-500 space-y-1 mt-1 list-none">
                <li>① ダッシュボードからリポジトリを選択</li>
                <li>② Slack連携ページで「<strong className="text-gray-700">Slackと連携する</strong>」をクリック</li>
                <li>③ Slackの認可画面でワークスペースを選択して「<strong className="text-gray-700">許可する</strong>」をクリック</li>
                <li>④ 通知先チャンネルを選択して「<strong className="text-gray-700">選択する</strong>」をクリック</li>
              </ol>
            </div>
          </li>
        </ol>
      ) : (
        <ol className="space-y-6">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">1</span>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-800">Slack App を作成する</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a> を開く</li>
                <li>② 右上の「<strong className="text-gray-700">Create New App</strong>」をクリック</li>
                <li>③「<strong className="text-gray-700">From scratch</strong>」を選択</li>
                <li>④ App Name に「<strong className="text-gray-700">Clearcode</strong>」と入力</li>
                <li>⑤ ワークスペースを選択して「<strong className="text-gray-700">Create App</strong>」をクリック</li>
              </ol>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">2</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Redirect URL を登録する</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① 左サイドバーの「<strong className="text-gray-700">OAuth &amp; Permissions</strong>」をクリック</li>
                <li>②「<strong className="text-gray-700">Redirect URLs</strong>」セクションまでスクロール</li>
                <li>③「<strong className="text-gray-700">Add New Redirect URL</strong>」で以下を追加</li>
              </ol>
              <div className="rounded-lg border border-gray-100 overflow-hidden text-xs mt-1">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-500 bg-neutral-50 w-24">ローカル用</td>
                      <td className="px-3 py-2 text-gray-800 font-mono">http://localhost:3001/api/auth/slack/callback</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-gray-500 bg-neutral-50">本番用</td>
                      <td className="px-3 py-2 text-gray-800 font-mono">https://あなたのドメイン.vercel.app/api/auth/slack/callback</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400">④ 両方追加したら「<strong className="text-gray-700">Save URLs</strong>」をクリック</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">3</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Bot Token Scopes を設定する</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① 同じページの「<strong className="text-gray-700">Scopes</strong>」セクションまでスクロール</li>
                <li>②「<strong className="text-gray-700">Bot Token Scopes</strong>」→「<strong className="text-gray-700">Add an OAuth Scope</strong>」で以下を3つ追加</li>
              </ol>
              <div className="rounded-lg border border-gray-100 overflow-hidden text-xs mt-1">
                <table className="w-full">
                  <tbody>
                    {['channels:read', 'chat:write', 'chat:write.public'].map((scope) => (
                      <tr key={scope} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2 text-gray-800 font-mono">{scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">4</span>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Client ID / Client Secret を取得して環境変数に登録する</p>
              <ol className="text-sm text-gray-500 space-y-1 list-none">
                <li>① 左サイドバーの「<strong className="text-gray-700">Basic Information</strong>」をクリック</li>
                <li>②「<strong className="text-gray-700">App Credentials</strong>」で Client ID と Client Secret を確認</li>
                <li>③ Vercel の <strong className="text-gray-700">Project → Settings → Environment Variables</strong> に追加</li>
              </ol>
              <div className="mt-1 bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed">
                SLACK_CLIENT_ID=<span className="text-yellow-300">取得したClient ID</span><br />
                SLACK_CLIENT_SECRET=<span className="text-yellow-300">取得したClient Secret</span><br />
                SLACK_REDIRECT_URI=<span className="text-yellow-300">https://あなたのドメイン.vercel.app/api/auth/slack/callback</span>
              </div>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">5</span>
            <div>
              <p className="text-sm font-medium text-gray-800">リポジトリのSlack設定ページで連携する</p>
              <ol className="text-sm text-gray-500 space-y-1 mt-1 list-none">
                <li>① ダッシュボードからリポジトリを選択</li>
                <li>② Slack連携ページで「<strong className="text-gray-700">Slackと連携する</strong>」をクリック</li>
                <li>③ Slackの認可画面でワークスペースを選択して「<strong className="text-gray-700">許可する</strong>」をクリック</li>
                <li>④ 通知先チャンネルを選択して「<strong className="text-gray-700">選択する</strong>」をクリック</li>
              </ol>
            </div>
          </li>
        </ol>
      )}
    </div>
  )
}
