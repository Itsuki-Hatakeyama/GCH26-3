"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommitCard, { type CommitWithSummary } from "@/components/CommitCard";
import BranchGraph, { type GraphBranchInfo } from "@/components/BranchGraph";
import type { Repository } from "@/types/database";

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function RepositoryDetailClient({ id }: { id: string }) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [unreadCommits, setUnreadCommits] = useState<CommitWithSummary[]>([]);
  const [allCommits, setAllCommits] = useState<CommitWithSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [branches, setBranches] = useState<GraphBranchInfo[]>([]);
  const [activeTab, setActiveTab] = useState<"commits" | "branches">("commits");

  const fetchCommits = useCallback(
    async (page = 1) => {
      const [unreadRes, allRes] = await Promise.all([
        fetch(`/api/repositories/${id}/commits?unread_only=true`),
        fetch(`/api/repositories/${id}/commits?page=${page}`),
      ]);
      if (!unreadRes.ok || !allRes.ok) throw new Error("コミットの取得に失敗しました");

      const unread = await unreadRes.json();
      const all = await allRes.json();

      setUnreadCommits(unread.commits);
      setAllCommits(all.commits);
      setPagination({
        page: all.pagination.page,
        totalPages: all.pagination.totalPages,
        total: all.pagination.total,
      });
    },
    [id]
  );

  const fetchAll = useCallback(
    async (page = 1) => {
      const repoRes = await fetch(`/api/repositories/${id}`);
      if (!repoRes.ok) throw new Error("リポジトリが見つかりません");
      setRepo(await repoRes.json());
      await fetchCommits(page);
    },
    [id, fetchCommits]
  );

  const syncAndFetch = useCallback(
    async (page = 1) => {
      await fetch(`/api/repositories/${id}/sync`, { method: "POST" });
      await fetchAll(page);
    },
    [id, fetchAll]
  );

  // 初回マウント: GitHub から sync してから表示
  useEffect(() => {
    (async () => {
      try {
        await syncAndFetch();
        await fetch(`/api/repositories/${id}/viewed`, { method: "PATCH" });
        fetch(`/api/repositories/${id}/branches`)
          .then((r) => r.json())
          .then((d) => { if (d.branches) setBranches(d.branches) })
          .catch(() => {})
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, syncAndFetch]);

  // 30秒ポーリング
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCommits(pagination.page).catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [fetchCommits, pagination.page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncAndFetch(pagination.page);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    await fetchCommits(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-red-500">{error ?? "リポジトリが見つかりません"}</p>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-full">ダッシュボードに戻る</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
            <Link href="/dashboard" className="hover:text-neutral-700 transition-colors">
              ホーム
            </Link>
            <span>/</span>
            <span className="text-neutral-900">{repo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black">{repo.name}</h1>
            {repo.is_private && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                プライベート
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-neutral-400 mt-1">{repo.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
              <ExternalLink className="w-3 h-3" />
              GitHub
            </Button>
          </a>
          <Link href={`/dashboard/repositories/${id}/slack`}>
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              Slack連携
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full text-xs"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            更新
          </Button>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("commits")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "commits"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          コミット
          {unreadCommits.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {unreadCommits.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("branches")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "branches"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          ブランチ
          {branches.length > 0 && (
            <span className="ml-1.5 text-xs text-neutral-400 font-normal">{branches.length}</span>
          )}
        </button>
      </div>

      {/* コミットタブ */}
      {activeTab === "commits" && (
        <div className="space-y-8">
          {unreadCommits.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">前回閲覧後の新着</h2>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {unreadCommits.length}
                </span>
              </div>
              <div className="space-y-3">
                {unreadCommits.map((commit) => (
                  <CommitCard key={commit.id} commit={commit} isUnread />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900">
                コミット履歴
                <span className="ml-2 font-normal text-neutral-400">({pagination.total}件)</span>
              </h2>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <GitBranch className="w-3 h-3" />
                {repo.default_branch}
              </div>
            </div>

            {allCommits.length === 0 ? (
              <div className="text-center py-12 text-sm text-neutral-400">
                コミットがありません
              </div>
            ) : (
              <div className="space-y-3">
                {allCommits.map((commit) => (
                  <CommitCard key={commit.id} commit={commit} />
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  前へ
                </Button>
                <span className="text-xs text-neutral-400">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  次へ
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ブランチタブ */}
      {activeTab === "branches" && (
        <div>
          {branches.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-12">ブランチ情報を読み込み中...</p>
          ) : (
            <BranchGraph
              repositoryId={id}
              branches={branches}
              defaultBranch={repo.default_branch}
            />
          )}
        </div>
      )}
    </div>
  );
}
