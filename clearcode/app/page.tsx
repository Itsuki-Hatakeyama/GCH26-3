import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <span className="text-lg font-semibold tracking-tight text-black">
            Clearcode
          </span>
          <Link href="/dashboard">
            <Button className="rounded-full px-5 text-sm">
              ログイン
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase mb-6">
            Powered by Gemini
          </p>
          <h2 className="text-5xl font-bold tracking-tight leading-tight text-black mb-6">
            エンジニアの変更を、<br />
            <span className="text-neutral-400">誰でもわかる言葉に。</span>
          </h2>
          <p className="text-base text-neutral-500 mb-10 leading-relaxed">
            GitHubのコミットを自動で平易な日本語に翻訳。<br />
            Slackで非エンジニアにも届く。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-8">
                Googleでログインして始める
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                デモを見る
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <section className="border-t border-neutral-100 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-3xl font-bold tracking-tight text-black mb-1">自動</p>
              <p className="text-sm text-neutral-500">コミット翻訳</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-black mb-1">即時</p>
              <p className="text-sm text-neutral-500">Slack通知</p>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-black mb-1">AI</p>
              <p className="text-sm text-neutral-500">品質スコア</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-6">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <span className="text-sm font-semibold tracking-tight text-black">Clearcode</span>
          <p className="text-xs text-neutral-400">© 2026 Clearcode</p>
        </div>
      </footer>
    </div>
  );
}
