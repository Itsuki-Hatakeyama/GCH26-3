import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center relative">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-black dark:text-white"
          >
            Clearcode
          </Link>
          {/* デスクトップナビ */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white">
                ホーム
              </Button>
            </Link>
            <Link href="/dashboard/connect-github">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white">
                リポジトリ追加
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white">
                設定
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white">
                プロフィール
              </Button>
            </Link>
            <LogoutButton />
          </nav>
          {/* モバイルナビ */}
          <MobileNav />
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}
