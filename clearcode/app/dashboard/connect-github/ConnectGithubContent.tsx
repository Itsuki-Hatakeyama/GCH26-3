"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  updated_at: string;
  already_connected?: boolean;
};

export default function ConnectGithubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  const [isGithubConnected, setIsGithubConnected] = useState<boolean | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/repositories")
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setIsGithubConnected(true);
          setRepos(data.repositories ?? []);
        } else {
          setIsGithubConnected(false);
          if (data.error?.code !== "NOT_CONNECTED") {
            setFetchError("リポジトリの取得に失敗しました");
          }
        }
      })
      .catch(() => setIsGithubConnected(false))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddRepos = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/repositories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_ids: selected.map(String) }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
    } else {
      setFetchError("リポジトリの追加に失敗しました");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-neutral-400">読み込み中...</div>;
  }

  // Phase A: GitHub未連携
  if (!isGithubConnected) {
    return (
      <div className="max-w-lg mx-auto px-6 py-10">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
        >
          ← ホームに戻る
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div className="text-4xl mb-4">🐙</div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">GitHubと連携する</h1>
          <p className="text-sm text-gray-500 mb-6">
            連携すると、リポジトリのコミットを自動で
            分かりやすい日本語に要約してSlackに通知します。
          </p>

          {errorCode && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              エラーが発生しました（{errorCode}）。もう一度お試しください。
            </div>
          )}

          <a
            href="/api/auth/github/start"
            className="flex items-center justify-center gap-3 w-full bg-[#1a7f37] hover:bg-[#166d30] text-white font-semibold text-sm py-3 rounded-lg transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHubで認証する
          </a>

          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-600">✓</span> 読み取り権限のみ要求します
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-600">✓</span> アクセストークンは暗号化して保存します
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-yellow-600">⚠</span> プライベートリポジトリのコードはLLMに送信されます
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Phase B: リポジトリ選択
  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        ← ホームに戻る
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-600">✓</span>
          <span className="text-sm text-green-700">GitHub連携が完了しました</span>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">監視するリポジトリを選択</h2>
        <p className="text-sm text-gray-500 mb-4">
          {selected.length > 0
            ? `${selected.length}件選択中`
            : "追加したいリポジトリにチェックを入れてください"}
        </p>

        <input
          type="text"
          placeholder="🔍 リポジトリ名で絞り込み..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50 mb-3 outline-none focus:border-indigo-400"
        />

        {fetchError && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {fetchError}
          </div>
        )}

        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto mb-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              リポジトリが見つかりません
            </div>
          ) : (
            filtered.map((repo) => (
              <div
                key={repo.id}
                onClick={() => !repo.already_connected && toggle(repo.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                  repo.already_connected
                    ? "opacity-50 cursor-not-allowed"
                    : selected.includes(repo.id)
                    ? "bg-indigo-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(repo.id) || !!repo.already_connected}
                  readOnly
                  disabled={repo.already_connected}
                  className="accent-indigo-600 w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {repo.name}
                    {repo.private && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5">
                        🔒 Private
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {repo.description}
                    </div>
                  )}
                </div>
                {repo.already_connected && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 shrink-0">
                    連携済み
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddRepos}
            disabled={selected.length === 0 || loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {loading ? "追加中..." : `選択した${selected.length}件を追加`}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
