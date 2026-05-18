import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Clearcode</h1>
          <Link href="/dashboard">
            <Button>Googleでログイン</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          エンジニアの変更を、<br />
          誰でもわかる言葉に。
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          GitHubのコミットを自動で平易な日本語に翻訳。Slackで非エンジニアにも届く。
        </p>
        <Link href="/dashboard">
          <Button size="lg">Googleでログインして始める</Button>
        </Link>
      </main>

      <footer className="border-t mt-20 py-8 text-center text-gray-500">
        <p>© 2026 Clearcode</p>
      </footer>
    </div>
  );
}
