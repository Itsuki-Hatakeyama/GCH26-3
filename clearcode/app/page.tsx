import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  Eye,
  GraduationCap,
  Briefcase,
  Users,
} from "lucide-react";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  // セッションが有効なら自動的にダッシュボードへ
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <span className="text-2xl font-bold text-blue-600">Clearcode</span>
          <a href="#login">
            <Button variant="outline">ログイン</Button>
          </a>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-white to-blue-50 py-20 text-center px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            エンジニアの変更を、
            <br />
            誰でもわかる言葉に。
          </h1>
          <p className="text-base md:text-xl text-gray-600 mb-10 leading-relaxed">
            GitHubのコミットを自動で平易な日本語に翻訳。
            <br className="hidden sm:block" />
            Slackで非エンジニアにも届く。
          </p>
          <div id="login">
            <LoginForm />
          </div>

          {/* イメージプレースホルダー */}
          <div className="mt-16 mx-auto max-w-3xl rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 h-64 flex items-center justify-center">
            <p className="text-white text-xl font-medium opacity-80">
              Slack通知イメージ
            </p>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Clearcodeでできること
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Sparkles className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  コミットメッセージを翻訳
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  専門用語だらけのコミットメッセージを、誰でも分かる言葉に書き換えます。
                  <br />
                  <span className="text-gray-400 mt-2 block text-xs">
                    &quot;fix: refactor auth middleware&quot; → &quot;ログイン処理の改善&quot;
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <FileText className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  コードの変更内容を解説
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  コードの差分から何が変わったかを自然な言葉で説明。バックエンドの変更も非エンジニアに伝わります。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Eye className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  画面の変化を視覚化
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  フロントエンドの変更を画像や説明文で表示。&quot;このボタンが追加されました&quot;が一目で分かります。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ユースケースセクション */}
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            こんなチームにおすすめ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <GraduationCap className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  学生団体・サークル
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  エンジニアと非エンジニアが混在するチームで、開発進捗を全員に共有できます。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Briefcase className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  非エンジニアPMがいるチーム
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  プロダクトマネージャーがコードを読まなくても、変更内容を把握できます。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <Users className="w-12 h-12 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  営業と開発が分かれている組織
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  営業チームに対して、リリース内容を分かりやすい言葉で自動共有できます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div>
              <h4 className="text-white font-semibold mb-3">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">機能紹介</a></li>
                <li><a href="#" className="hover:text-white transition-colors">料金</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">利用規約</a></li>
                <li><a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">セキュリティについて</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                ※プライベートリポジトリのコードはGemini APIに送信されます。詳細はプライバシーポリシーをご確認ください。
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
            © 2026 Clearcode. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
