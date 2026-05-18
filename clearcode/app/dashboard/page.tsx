import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            リポジトリ
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            連携中のGitHubリポジトリ一覧
          </p>
        </div>
        <Link href="/dashboard/connect-github">
          <Button className="rounded-full px-5 text-sm">
            + 追加
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-16 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-black mb-1">
          リポジトリがありません
        </p>
        <p className="text-xs text-neutral-400 mb-6">
          GitHubと連携してコミットの翻訳を始めましょう
        </p>
        <Link href="/dashboard/connect-github">
          <Button variant="outline" className="rounded-full px-6 text-sm">
            GitHubと連携する
          </Button>
        </Link>
      </div>
    </div>
  );
}
