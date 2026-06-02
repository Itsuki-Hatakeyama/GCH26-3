export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <a href="/" className="text-xl font-semibold text-blue-600 tracking-tight">Clearcode</a>
        </div>
      </header>
      <main className="container mx-auto px-6 py-16 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
        <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">収集する情報</h2>
            <p>本サービスは、GitHubおよびSlackとの連携に必要な情報（メールアドレス、アクセストークン）を収集します。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">情報の利用目的</h2>
            <p>収集した情報は、GitHubのコミット内容をSlackに通知するサービスの提供にのみ使用します。第三者への提供は行いません。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">外部サービスへのデータ送信</h2>
            <p>コミットの内容はAI要約生成のためGemini APIに送信されます。Slackへのメッセージ投稿にはSlack Web APIを使用します。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">トークンの管理</h2>
            <p>GitHubおよびSlackのアクセストークンは暗号化した上でデータベースに保存します。</p>
          </section>
        </div>
      </main>
    </div>
  )
}
