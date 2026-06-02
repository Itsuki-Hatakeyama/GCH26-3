import Link from "next/link";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-black"
          >
            Clearcode
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black">
                ホーム
              </Button>
            </Link>
            <Link href="/dashboard/connect-github">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black">
                リポジトリ追加
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="ghost" className="text-sm text-neutral-500 hover:text-black">
                設定
              </Button>
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
