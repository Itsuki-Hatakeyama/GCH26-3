"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechBadge from "@/components/TechBadge";

type Tab = "summary" | "visual" | "code";

interface Technology {
  name: string;
  category: string;
  language?: string;
}

interface CommitSummary {
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: Technology[] | null;
  removed_technologies: Technology[] | null;
  technology_categories: Record<string, string[]> | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
}

interface CommitDetail {
  id: string;
  sha: string;
  message: string;
  author_name: string;
  committed_at: string;
  html_url: string;
  repository_id: string;
  commit_summaries: CommitSummary[];
}

interface Props {
  repositoryId: string;
  sha: string;
  repositoryName: string;
}

export default function CommitDetailClient({ repositoryId, sha, repositoryName }: Props) {
  const [commit, setCommit] = useState<CommitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const fetchCommit = useCallback(async () => {
    const res = await fetch(`/api/repositories/${repositoryId}/commits?sha=${sha}`);
    if (!res.ok) throw new Error("コミットが見つかりません");
    const data = await res.json();
    setCommit(data.commit);
  }, [repositoryId, sha]);

  useEffect(() => {
    (async () => {
      try {
        await fetchCommit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCommit]);

  const handleCopySha = async () => {
    await navigator.clipboard.writeText(sha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!commit) return;
    setRegenerating(true);
    try {
      const res = await fetch(`/api/commits/${commit.id}/regenerate-summary`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("再生成に失敗しました");
      await fetchCommit();
      setRegenerated(true);
      setTimeout(() => setRegenerated(false), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !commit) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-red-500">{error ?? "コミットが見つかりません"}</p>
        <Link href={`/dashboard/repositories/${repositoryId}`}>
          <Button variant="outline" className="rounded-full">リポジトリに戻る</Button>
        </Link>
      </div>
    );
  }

  const s = commit.commit_summaries?.[0] ?? null;
  const date = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(commit.committed_at));

  const hasTech =
    (s?.added_technologies?.length ?? 0) > 0 ||
    (s?.removed_technologies?.length ?? 0) > 0;

  const score = s?.message_quality_score ?? null;
  const scoreColor =
    score === null ? "text-gray-400"
    : score >= 80 ? "text-green-600"
    : score >= 60 ? "text-yellow-600"
    : "text-red-600";
  const scoreBg =
    score === null ? "bg-gray-50 border-gray-200"
    : score >= 80 ? "bg-green-50 border-green-200"
    : score >= 60 ? "bg-yellow-50 border-yellow-200"
    : "bg-red-50 border-red-200";

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "ひとことで" },
    { key: "visual", label: "画面の変化" },
    { key: "code", label: "コードの変更" },
  ];

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/dashboard" className="hover:text-neutral-700 transition-colors">ホーム</Link>
        <span>/</span>
        <Link href={`/dashboard/repositories/${repositoryId}`} className="hover:text-neutral-700 transition-colors">
          {repositoryName}
        </Link>
        <span>/</span>
        <span className="font-mono text-neutral-600">{sha.slice(0, 7)}</span>
      </div>

      {/* コミット情報ヘッダー */}
      <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySha}
              className="flex items-center gap-1.5 font-mono text-sm text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors px-2.5 py-1 rounded-lg"
            >
              <span>{sha.slice(0, 7)}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs">
              <ExternalLink className="w-3 h-3" />
              GitHubで見る
            </Button>
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{commit.author_name}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
      </div>

      {/* タブ */}
      {s ? (
        <div className="space-y-4">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 p-6 min-h-36">
            {activeTab === "summary" && (
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {s.simplified_message}
                </p>
                <p className="text-xs text-neutral-400">AIによる平易化</p>
              </div>
            )}

            {activeTab === "visual" && (
              <div>
                {s.frontend_changes ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-purple-700 mb-2">画面の変化</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{s.frontend_changes}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-sm text-neutral-400">このコミットに画面の変更はありません</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "code" && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed">{s.code_explanation}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-8 text-center">
          <p className="text-sm text-neutral-400">要約がまだ生成されていません</p>
        </div>
      )}

      {/* 技術スタック */}
      {hasTech && (
        <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">技術スタックの変化</h2>
          <div className="flex flex-wrap gap-1.5">
            {s?.added_technologies?.map((t, i) => (
              <TechBadge key={`add-${i}`} name={t.name} type="added" />
            ))}
            {s?.removed_technologies?.map((t, i) => (
              <TechBadge key={`rm-${i}`} name={t.name} type="removed" />
            ))}
          </div>
        </div>
      )}

      {/* 精度評価 */}
      {score !== null && (
        <div className={`rounded-xl border p-5 space-y-3 ${scoreBg}`}>
          <h2 className="text-sm font-semibold text-neutral-900">コミットメッセージの精度評価</h2>
          <div className="flex items-baseline gap-1">
            <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-neutral-400 text-lg">/ 100</span>
          </div>
          {s?.message_quality_feedback && (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {s.message_quality_feedback}
            </p>
          )}
          {score < 60 && (
            <p className="text-xs text-neutral-500">
              スコアが低い場合は「要約を再生成」でより良いメッセージの提案が得られます
            </p>
          )}
        </div>
      )}

      {/* 元のコミットメッセージ */}
      <div className="bg-white rounded-xl border border-neutral-100 p-5 space-y-2">
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-neutral-900"
        >
          <span>元のコミットメッセージ</span>
          <span className="text-xs text-neutral-400">{showOriginal ? "閉じる" : "展開"}</span>
        </button>
        {showOriginal && (
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-3 whitespace-pre-wrap font-mono">
            {commit.message}
          </pre>
        )}
      </div>

      {/* アクション */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "生成中..." : regenerated ? "再生成しました" : "要約を再生成"}
        </Button>
      </div>
    </div>
  );
}
