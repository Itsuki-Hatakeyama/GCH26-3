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
              Clearcodeを使うには、まず自分のGitHubアカウントで <strong className="text-gray-700">OAuth App</strong> を作成し、Clearcodeと連携させる必要があります。
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
                          ["Homepage URL", "http://localhost:3001"],
                          ["Authorization callback URL", "http://localhost:3001/api/auth/github/callback"],
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
                  <p className="text-sm font-medium text-gray-800">Client ID / Client Secret を .env.local に追記する</p>
                  <div className="mt-2 bg-gray-900 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed">
                    <span className="text-gray-500"># .env.local</span><br />
                    GITHUB_CLIENT_ID=<span className="text-yellow-300">ここにClient ID</span><br />
                    GITHUB_CLIENT_SECRET=<span className="text-yellow-300">ここにClient Secret</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">変更後は開発サーバーを再起動（npm run dev）してください</p>
                </div>
              </li>

              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">4</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">GitHub連携ページで認証する</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <a href="/dashboard/connect-github" className="text-blue-600 hover:underline">
                      リポジトリ追加ページ
                    </a>
                    {" "}に移動し、「GitHubと連携する」ボタンを押して認証を完了してください。
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
