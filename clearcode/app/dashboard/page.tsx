import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">あなたのリポジトリ</h1>
        <Link href="/dashboard/connect-github">
          <Button>+ リポジトリを追加</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed">
        <p className="text-gray-500 mb-4">まだリポジトリが連携されていません</p>
        <Link href="/dashboard/connect-github">
          <Button size="lg">GitHubと連携する</Button>
        </Link>
      </div>
    </div>
  );
}
