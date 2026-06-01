import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sparkles, FileText, Eye, GraduationCap, Briefcase, Users } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <span className="text-xl font-semibold text-blue-600 tracking-tight">Clearcode</span>
          <a href="#login">
            <Button variant="outline" className="text-sm">ログイン</Button>
          </a>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="py-24 px-6 text-center">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-5 leading-tight">
            エンジニアの変更を、<br />誰でもわかる言葉に。
          </h1>
          <p className="text-base md:text-lg text-gray-500 mb-12 leading-relaxed">
            GitHubのコミットを自動で平易な日本語に翻訳。<br className="hidden sm:block" />
            Slackで非エンジニアにも届く。
          </p>
          <div id="login">
            <LoginForm />
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="bg-neutral-50 py-20 px-6 border-t border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-10">
            Clearcodeでできること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Sparkles className="w-5 h-5 text-gray-400" />,
                title: "コミットメッセージを翻訳",
                desc: '専門用語だらけのコミットメッセージを、誰でも分かる言葉に書き換えます。',
                sub: '"fix: refactor auth middleware" → "ログイン処理の改善"',
              },
              {
                icon: <FileText className="w-5 h-5 text-gray-400" />,
                title: "コードの変更内容を解説",
                desc: "コードの差分から何が変わったかを自然な言葉で説明。バックエンドの変更も非エンジニアに伝わります。",
              },
              {
                icon: <Eye className="w-5 h-5 text-gray-400" />,
                title: "画面の変化を視覚化",
                desc: 'フロントエンドの変更を画像や説明文で表示。"このボタンが追加されました"が一目で分かります。',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                {item.sub && (
                  <p className="mt-2 text-xs text-gray-400">{item.sub}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ユースケースセクション */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-900 text-center mb-10">
            こんなチームにおすすめ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <GraduationCap className="w-5 h-5 text-gray-400" />,
                title: "学生団体・サークル",
                desc: "エンジニアと非エンジニアが混在するチームで、開発進捗を全員に共有できます。",
              },
              {
                icon: <Briefcase className="w-5 h-5 text-gray-400" />,
                title: "非エンジニアPMがいるチーム",
                desc: "プロダクトマネージャーがコードを読まなくても、変更内容を把握できます。",
              },
              {
                icon: <Users className="w-5 h-5 text-gray-400" />,
                title: "営業と開発が分かれている組織",
                desc: "営業チームに対して、リリース内容を分かりやすい言葉で自動共有できます。",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 py-8 px-6 mt-auto">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span className="font-medium text-blue-600">Clearcode</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-600 transition-colors">利用規約</a>
            <a href="#" className="hover:text-gray-600 transition-colors">プライバシーポリシー</a>
            <a href="#" className="hover:text-gray-600 transition-colors">お問い合わせ</a>
          </div>
          <span>© 2026 Clearcode. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
