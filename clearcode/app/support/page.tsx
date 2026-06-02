export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <a href="/" className="text-xl font-semibold text-blue-600 tracking-tight">Clearcode</a>
        </div>
      </header>
      <main className="container mx-auto px-6 py-16 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">サポート</h1>
        <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">よくある質問</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-800">GitHub連携ができません</p>
                <p className="mt-1">GitHubのOAuth Appに正しいcallback URLが登録されているか確認してください。</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Slackに通知が届きません</p>
                <p className="mt-1">BotがSlackチャンネルに参加しているか確認してください。チャンネルで <code className="bg-gray-100 px-1 rounded">/invite @Clearcode</code> を実行してください。</p>
              </div>
            </div>
          </section>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">お問い合わせ</h2>
            <p>ご不明な点はダッシュボードの設定ページよりお問い合わせください。</p>
          </section>
        </div>
      </main>
    </div>
  )
}
