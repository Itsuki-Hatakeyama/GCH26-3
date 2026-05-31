import { Suspense } from "react";
import ConnectGithubContent from "./ConnectGithubContent";

export const dynamic = "force-dynamic";

export default function ConnectGithubPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400">読み込み中...</div>}>
      <ConnectGithubContent />
    </Suspense>
  );
}
