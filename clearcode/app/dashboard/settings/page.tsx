export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">設定</h1>
        <p className="text-sm text-gray-500 mt-1">アカウントや連携の設定を管理します</p>
      </div>

      {/* 使用方法 */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">使用方法</h2>

        {/* Step 1 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-neutral-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 1</span>
            <span className="text-sm font-semibold text-gray-800">GitHub連携の設定</span>
          </div>
          <div className="px-5 py-5 space-y-5">
            <p className="text-sm text-gray-500 leading-relaxed">
              Clearcodeを使うには、GitHubアカウントで <strong className="text-gray-700">OAuth App</strong> を作成し、デプロイ先に環境変数として登録する必要があります。
            </p>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">GitHub の設定を開く</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      github.com/settings/developers
                    </a>
                    {" "}→ 「OAuth Apps」→「New OAuth App」をクリック
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">アプリ情報を入力する</p>
                  <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden text-xs">
                    <table className="w-full">
                      <tbody>
                        {[
                          ["Application name", "Clearcode"],
                          ["Homepage URL", "https://あなたのドメイン.vercel.app"],
                          ["Authorization callback URL", "https://あなたのドメイン.vercel.app/api/auth/github/callback"],
                        ].map(([label, value]) => (
                          <tr key={label} className="border-b border-gray-100 last:border-0">
                            <td className="px-3 py-2 text-gray-500 bg-neutral-50 w-48">{label}</td>
                            <td className="px-3 py-2 text-gray-800 font-mono">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">入力後「Register application」をクリック</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">デプロイ先に環境変数を登録する</p>
                  <p className="text-sm text-gray-500 mt-0.5 mb-2">
                    Vercel の場合は <strong className="text-gray-700">Project → Settings → Environment Variables</strong> に以下を追加してください。
                  </p>
                  <div className="bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed">
                    <span className="text-gray-500"># Vercel の Environment Variables に追加</span><br />
                    GITHUB_CLIENT_ID=<span className="text-yellow-300">取得したClient ID</span><br />
                    GITHUB_CLIENT_SECRET=<span className="text-yellow-300">取得したClient Secret</span><br />
                    NEXT_PUBLIC_APP_URL=<span className="text-yellow-300">https://あなたのドメイン.vercel.app</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    ⚠️ <code className="bg-gray-100 px-1 rounded">.env.local</code> はGitにコミットされないため、デプロイ先には自動反映されません。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">4</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">再デプロイして GitHub連携を行う</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    環境変数を追加したら再デプロイし、
                    <a href="/dashboard/connect-github" className="text-blue-600 hover:underline ml-1">リポジトリ追加ページ</a>
                    で「GitHubと連携する」を押して認証を完了してください。
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Step 2 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-neutral-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 2</span>
            <span className="text-sm font-semibold text-gray-800">Slack連携の設定</span>
          </div>
          <div className="px-5 py-5 space-y-5">
            <p className="text-sm text-gray-500 leading-relaxed">
              コードレビュー結果をSlackに通知するには、<strong className="text-gray-700">Slack App</strong> を作成し、Clearcodeと連携させる必要があります。
            </p>

            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Slack App を作成する</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      api.slack.com/apps
                    </a>
                    {" "}→「Create New App」→「From scratch」を選択し、App名とワークスペースを設定してください。
                  </p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">OAuth & Permissions を設定する</p>
                  <p className="text-sm text-gray-500 mt-0.5">サイドバーの「OAuth &amp; Permissions」を開き、以下を設定してください。</p>
                  <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden text-xs">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-500 bg-neutral-50 w-48">Redirect URL</td>
                          <td className="px-3 py-2 text-gray-800 font-mono">https://あなたのドメイン.vercel.app/api/auth/slack/callback</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-500 bg-neutral-50">Bot Token Scopes</td>
                          <td className="px-3 py-2 text-gray-800 font-mono">channels:read, chat:write, chat:write.public</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Redirect URLは「Add」ボタンで追加後「Save URLs」をクリックしてください。</p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">デプロイ先に環境変数を登録する</p>
                  <p className="text-sm text-gray-500 mt-0.5">「Basic Information」→「App Credentials」から取得し、Vercelの Environment Variables に追加してください。</p>
                  <div className="mt-2 bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed">
                    <span className="text-gray-500"># Vercel の Environment Variables に追加</span><br />
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
                  <p className="text-sm text-gray-500 mt-0.5">
                    各リポジトリの設定ページに移動し、「Slackと連携する」ボタンを押してワークスペースへの認証を完了してください。認証後、通知先チャンネルを選択できます。
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        {/* Step 3 */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-neutral-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Step 3</span>
            <span className="text-sm font-semibold text-gray-800">Slack Distribution の有効化（複数ワークスペース対応）</span>
          </div>
          <div className="px-5 py-5 space-y-5">
            <p className="text-sm text-gray-500 leading-relaxed">
              デフォルトでは Slack App は作成したワークスペース専用です。<strong className="text-gray-700">複数のワークスペースから連携できるようにする</strong>には、Distribution（配布）を有効にする必要があります。
            </p>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Manage Distribution を開く</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">api.slack.com/apps</a>
                    {" "}→ 該当アプリ → サイドバーの「Manage Distribution」をクリック
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">Privacy Policy と Support URL を設定する</p>
                  <p className="text-sm text-gray-500 mt-0.5 mb-2">有効化の前にSlackから以下のURLの入力が求められます。</p>
                  <div className="rounded-lg border border-gray-100 overflow-hidden text-xs">
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-500 bg-neutral-50 w-48">Privacy Policy URL</td>
                          <td className="px-3 py-2 text-gray-800 font-mono">https://あなたのドメイン.vercel.app/privacy</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="px-3 py-2 text-gray-500 bg-neutral-50">Support URL</td>
                          <td className="px-3 py-2 text-gray-800 font-mono">https://あなたのドメイン.vercel.app/support</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    ※ <code className="bg-gray-100 px-1 rounded">/privacy</code> と <code className="bg-gray-100 px-1 rounded">/support</code> のページはClearcodeに用意してあります。
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">「Activate Public Distribution」をクリックする</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    上記の入力が完了するとボタンが押せるようになります。有効にすると任意のSlackワークスペースから連携できるようになります。
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
