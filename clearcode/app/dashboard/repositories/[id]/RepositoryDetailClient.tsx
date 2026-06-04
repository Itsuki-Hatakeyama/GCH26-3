"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommitCard, { type CommitWithSummary } from "@/components/CommitCard";
import type { Repository } from "@/types/database";

interface Pagination {
  page: number;
  hasNextPage: boolean;
}

export default function RepositoryDetailClient({ id }: { id: string }) {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [unreadCommits, setUnreadCommits] = useState<CommitWithSummary[]>([]);
  const [allCommits, setAllCommits] = useState<CommitWithSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommitsFromDB = useCallback(
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
      return all;
    },
    [id]
  );

  // ページ指定でGitHubからsyncしてからDBを表示する
  const syncAndFetchPage = useCallback(
    async (page = 1) => {
      const syncRes = await fetch(`/api/repositories/${id}/sync?page=${page}`, { method: "POST" });
      const syncData = syncRes.ok ? await syncRes.json() : { hasNextPage: false };
      const all = await fetchCommitsFromDB(page);
      setPagination({ page, hasNextPage: syncData.hasNextPage ?? false });
      return all;
    },
    [id, fetchCommitsFromDB]
  );

  const fetchRepo = useCallback(async () => {
    const repoRes = await fetch(`/api/repositories/${id}`);
    if (!repoRes.ok) throw new Error("リポジトリが見つかりません");
    setRepo(await repoRes.json());
  }, [id]);

  // 初回マウント: page=1 をsync→表示
  useEffect(() => {
    (async () => {
      try {
        await fetchRepo();
        await syncAndFetchPage(1);
        await fetch(`/api/repositories/${id}/viewed`, { method: "PATCH" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, fetchRepo, syncAndFetchPage]);

  // 30秒ポーリング（DBからのみ再取得、GitHubは叩かない）
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCommitsFromDB(pagination.page).catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [fetchCommitsFromDB, pagination.page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncAndFetchPage(pagination.page);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setPageLoading(true);
    try {
      await syncAndFetchPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setPageLoading(false);
    }
  };

  // 日付ラベル
  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (dt: Date) => `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
    if (fmt(d) === fmt(today)) return "今日";
    if (fmt(d) === fmt(yesterday)) return "昨日";
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" }).format(d);
  };

  // コミットを日付でグループ化
  const groupedCommits = useMemo(() => {
    const groups: { label: string; commits: CommitWithSummary[] }[] = [];
    const seen = new Map<string, number>();
    for (const c of allCommits) {
      const label = dateLabel(c.committed_at);
      if (!seen.has(label)) {
        seen.set(label, groups.length);
        groups.push({ label, commits: [] });
      }
      groups[seen.get(label)!].commits.push(c);
    }
    return groups;
  }, [allCommits]);

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

      {/* 未読セクション */}
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
              <CommitCard key={commit.id} commit={commit} isUnread branch={repo.default_branch} />
            ))}
          </div>
        </section>
      )}

      {/* コミット履歴 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">
          コミット履歴
          <span className="ml-2 font-normal text-neutral-400">（{pagination.page}ページ目）</span>
        </h2>

        {pageLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allCommits.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-400">
            コミットがありません
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCommits.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-neutral-400">{group.label}</span>
                  <div className="flex-1 h-px bg-neutral-100" />
                </div>
                <div className="space-y-3">
                  {group.commits.map((commit) => (
                    <CommitCard key={commit.id} commit={commit} branch={repo.default_branch} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ページネーション */}
        {(pagination.page > 1 || pagination.hasNextPage) && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={pagination.page <= 1 || pageLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              前へ
            </Button>
            <span className="text-xs text-neutral-400">
              {pagination.page} ページ目
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs"
              disabled={!pagination.hasNextPage || pageLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              次へ
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
