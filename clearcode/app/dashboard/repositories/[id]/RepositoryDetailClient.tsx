"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, RefreshCw, Trash2, GitBranch, ChevronDown, Search, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommitCard, { type CommitWithSummary } from "@/components/CommitCard";
import type { Repository, RepositoryMember } from "@/types/database";

function BranchSelector({
  branches,
  selected,
  onChange,
}: {
  branches: string[];
  selected: string | null;
  onChange: (branch: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? branches.filter((b) => b.toLowerCase().includes(q)) : branches;
  }, [branches, query]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (branch: string | null) => {
    onChange(branch);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white text-neutral-700 hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-300 transition-colors"
      >
        <GitBranch className="w-3 h-3 text-neutral-400" />
        <span className="max-w-[160px] truncate">{selected ?? "すべてのブランチ"}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
          {/* 検索 */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
            <Search className="w-3 h-3 text-neutral-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ブランチを検索..."
              className="w-full text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none bg-transparent"
            />
          </div>

          {/* 選択肢 */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {!query && (
              <li>
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    selected === null
                      ? "bg-neutral-100 text-neutral-900 font-medium"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  すべてのブランチ
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-xs text-neutral-400 text-center">見つかりません</li>
            ) : (
              filtered.map((branch) => (
                <li key={branch}>
                  <button
                    onClick={() => handleSelect(branch)}
                    className={`w-full text-left px-3 py-1.5 text-xs truncate transition-colors ${
                      selected === branch
                        ? "bg-neutral-100 text-neutral-900 font-medium"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    {branch}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface Pagination {
  page: number;
  hasNextPage: boolean;
}

export default function RepositoryDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [repo, setRepo] = useState<(Repository & { is_owner?: boolean }) | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [unreadCommits, setUnreadCommits] = useState<CommitWithSummary[]>([]);
  const [allCommits, setAllCommits] = useState<CommitWithSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState<RepositoryMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchCommitsFromDB = useCallback(
    async (page = 1, branch: string | null = null) => {
      const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : "";
      const [unreadRes, allRes] = await Promise.all([
        fetch(`/api/repositories/${id}/commits?unread_only=true${branchParam}`),
        fetch(`/api/repositories/${id}/commits?page=${page}${branchParam}`),
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

  // 全ブランチ分syncしてからDBを表示
  const syncAndFetchPage = useCallback(
    async (page = 1, branch: string | null = null) => {
      const syncRes = await fetch(`/api/repositories/${id}/sync?page=${page}`, { method: "POST" });
      const syncData = syncRes.ok ? await syncRes.json() : { hasNextPage: false, branches: [] };

      // syncから返ってきたブランチ一覧をセット（初回のみ）
      if (syncData.branches?.length > 0) {
        setBranches(syncData.branches);
      }

      await fetchCommitsFromDB(page, branch);
      setPagination({ page, hasNextPage: syncData.hasNextPage ?? false });
    },
    [id, fetchCommitsFromDB]
  );

  const fetchRepo = useCallback(async () => {
    const repoRes = await fetch(`/api/repositories/${id}`);
    if (!repoRes.ok) throw new Error("リポジトリが見つかりません");
    setRepo(await repoRes.json());
  }, [id]);

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/repositories/${id}/members`);
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
    }
  }, [id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await fetch(`/api/repositories/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error?.message ?? "招待に失敗しました");
        return;
      }
      setInviteEmail("");
      await fetchMembers();
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("このメンバーを削除しますか？")) return;
    await fetch(`/api/repositories/${id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });
    await fetchMembers();
  };

  // 初回マウント
  useEffect(() => {
    (async () => {
      try {
        await fetchRepo();
        await syncAndFetchPage(1, null);
        await fetch(`/api/repositories/${id}/viewed`, { method: "PATCH" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, fetchRepo, syncAndFetchPage]);

  useEffect(() => {
    if (repo) fetchMembers();
  }, [repo, fetchMembers]);

  // 30秒ポーリング（DBのみ、GitHub不要）
  useEffect(() => {
    const timer = setInterval(() => {
      fetchCommitsFromDB(pagination.page, selectedBranch).catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [fetchCommitsFromDB, pagination.page, selectedBranch]);

  const handleBranchSelect = async (branch: string | null) => {
    setSelectedBranch(branch);
    setPageLoading(true);
    try {
      // ブランチ切り替えはDBのみから再取得（GitHubは叩かない）
      const all = await fetchCommitsFromDB(1, branch);
      setPagination({ page: 1, hasNextPage: (all.commits?.length ?? 0) === 15 });
    } finally {
      setPageLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncAndFetchPage(pagination.page, selectedBranch);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!repo) return;
    if (!confirm(`「${repo.name}」を削除しますか？\nコミット履歴や要約データもすべて削除されます。`)) return;
    const res = await fetch(`/api/repositories/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  };

  const handlePageChange = async (newPage: number) => {
    setPageLoading(true);
    try {
      if (newPage > pagination.page) {
        // 次へ: GitHubからそのページを取得してDB保存
        await syncAndFetchPage(newPage, selectedBranch);
      } else {
        // 前へ: DBのみから取得
        await fetchCommitsFromDB(newPage, selectedBranch);
        setPagination((prev) => ({ ...prev, page: newPage, hasNextPage: true }));
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setPageLoading(false);
    }
  };

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
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
            <Link href="/dashboard" className="hover:text-neutral-700 transition-colors">ホーム</Link>
            <span>/</span>
            <span className="text-neutral-900">{repo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-black">{repo.name}</h1>
            {repo.is_private && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">プライベート</span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-neutral-400 mt-1">{repo.description}</p>
          )}
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate max-w-[240px] sm:max-w-none">{repo.html_url}</span>
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
              <ExternalLink className="w-3 h-3" />
              GitHub
            </Button>
          </a>
          <Link href={`/dashboard/repositories/${id}/slack`}>
            <Button variant="outline" size="sm" className="rounded-full text-xs">Slack連携</Button>
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
          {repo.is_owner && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full text-xs text-red-500 hover:text-red-600 hover:border-red-300"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3" />
              削除
            </Button>
          )}
        </div>
      </div>

      {/* メンバーセクション */}
      <div className="border border-neutral-100 rounded-xl p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-neutral-400" />
            メンバー
            {members.length > 0 && (
              <span className="text-xs font-normal text-neutral-400">({members.length}人)</span>
            )}
          </h2>
        </div>

        {/* オーナーのみ招待フォームを表示 */}
        {repo.is_owner && (
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="メールアドレスで招待..."
              required
              className="flex-1 text-xs border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
            <Button type="submit" size="sm" className="rounded-lg text-xs shrink-0" disabled={inviteLoading}>
              {inviteLoading ? "送信中..." : "招待"}
            </Button>
          </form>
        )}
        {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}

        {/* オーナー行（常に先頭に表示） */}
        <ul className="space-y-1.5">
          <li className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-neutral-50">
            <span className="flex items-center gap-2 min-w-0">
              <span className="text-neutral-700 truncate">{repo.full_name.split("/")[0]}</span>
              <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700">オーナー</span>
            </span>
          </li>
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors">
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-neutral-700 truncate">{m.email}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] ${
                  m.status === "active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {m.status === "active" ? "参加済み" : "招待中"}
                </span>
              </span>
              {repo.is_owner && (
                <button
                  onClick={() => handleRemoveMember(m.id)}
                  className="shrink-0 ml-2 text-neutral-300 hover:text-red-500 transition-colors"
                  title="削除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
          {members.length === 0 && (
            <li className="text-xs text-neutral-400 px-2 py-1">まだメンバーがいません</li>
          )}
        </ul>
      </div>

      {/* ブランチフィルター */}
      {branches.length > 0 && (
        <div>
          <BranchSelector
            branches={branches}
            selected={selectedBranch}
            onChange={handleBranchSelect}
          />
        </div>
      )}

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
              <CommitCard key={commit.id} commit={commit} isUnread selectedBranch={selectedBranch} defaultBranch={repo.default_branch} />
            ))}
          </div>
        </section>
      )}

      {/* コミット履歴 */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">
          コミット履歴
          <span className="ml-2 font-normal text-neutral-400">
            {selectedBranch ? `（${selectedBranch}）` : "（全ブランチ）"}
            {pagination.page > 1 && ` · ${pagination.page}ページ目`}
          </span>
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
                    <CommitCard key={commit.id} commit={commit} selectedBranch={selectedBranch} defaultBranch={repo.default_branch} />
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
            <span className="text-xs text-neutral-400">{pagination.page} ページ目</span>
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
