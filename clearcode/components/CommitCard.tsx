"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, GitBranch, GitMerge, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechBadge from "@/components/TechBadge";
import QualityScore from "@/components/QualityScore";
import ChangedFileList from "@/components/ChangedFileList";

interface Technology {
  name: string;
  category: string;
  language?: string;
}

function parseMergeInfo(message: string, defaultBranch?: string): { source: string; target: string } | null {
  const first = message.split("\n")[0].trim();

  // Merge branch 'feature/x' into develop
  const intoMatch = first.match(/^Merge branch '(.+)' into (.+)$/);
  if (intoMatch) return { source: intoMatch[1], target: intoMatch[2] };

  // Merge branch 'feature/x'  (into default branch)
  const branchMatch = first.match(/^Merge branch '(.+)'$/);
  if (branchMatch) return { source: branchMatch[1], target: defaultBranch ?? "main" };

  // Merge pull request #N from user/feature/x
  const prMatch = first.match(/^Merge pull request #\d+ from [^/]+\/(.+)$/);
  if (prMatch) return { source: prMatch[1], target: defaultBranch ?? "main" };

  return null;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  フロントエンド:   { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  バックエンド:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"   },
  インフラ:         { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  テスト:           { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"  },
  ドキュメント:     { bg: "bg-gray-50",    text: "text-gray-600",    border: "border-gray-200"   },
  設定:             { bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200" },
  リファクタリング: { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"   },
  バグ修正:         { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"    },
};

interface CommitSummaryData {
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: Technology[] | null;
  removed_technologies: Technology[] | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
  change_categories: string[] | null;
}

export interface CommitWithSummary {
  id: string;
  sha: string;
  message: string;
  author_name: string;
  committed_at: string;
  html_url: string;
  repository_id: string;
  changed_files: string[] | null;
  branch_names: string[] | null;
  commit_summaries: CommitSummaryData[] | CommitSummaryData | null;
}

interface CommitCardProps {
  commit: CommitWithSummary;
  isUnread?: boolean;
  selectedBranch?: string | null;
  defaultBranch?: string;
}

export default function CommitCard({ commit, isUnread = false, selectedBranch, defaultBranch }: CommitCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [summaryData, setSummaryData] = useState<CommitSummaryData | null>(
    Array.isArray(commit.commit_summaries)
      ? (commit.commit_summaries[0] ?? null)
      : (commit.commit_summaries ?? null)
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const s = summaryData;
  const isMerged = !!(defaultBranch && commit.branch_names?.includes(defaultBranch));
  const mergeInfo = parseMergeInfo(commit.message, defaultBranch);

  const handleGenerateSummary = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch(`/api/commits/${commit.id}/regenerate-summary`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error?.message ?? "生成に失敗しました");
        return;
      }
      setSummaryData({
        simplified_message: data.simplified_message,
        code_explanation: data.code_explanation,
        frontend_changes: data.frontend_changes ?? null,
        added_technologies: data.added_technologies ?? null,
        removed_technologies: data.removed_technologies ?? null,
        message_quality_score: data.message_quality_score ?? null,
        message_quality_feedback: data.message_quality_feedback ?? null,
        change_categories: data.change_categories ?? null,
      });
    } finally {
      setGenerating(false);
    }
  };

  const date = new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(commit.committed_at));

  const router = useRouter();
  const detailHref = `/dashboard/repositories/${commit.repository_id}/commits/${commit.sha}`;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("a, button")) return;
    router.push(detailHref);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl border p-4 sm:p-5 space-y-3 cursor-pointer hover:border-neutral-300 transition-colors ${
        isUnread ? "bg-blue-50/40 border-blue-200" : "bg-white border-neutral-100"
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          {/* 原文タイトル */}
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {commit.message.split('\n')[0]}
          </p>
          {/* 著者・ブランチ */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
            <User className="w-3 h-3 shrink-0" />
            <span className="font-medium">{commit.author_name}</span>
            <span className="text-gray-300">·</span>
            <span>{date}</span>
            <span className="text-gray-300">·</span>
            <span className="font-mono text-gray-400">{commit.sha.slice(0, 7)}</span>
            {(() => {
              const branches = selectedBranch
                ? [selectedBranch]
                : (commit.branch_names ?? []);
              const shown = branches.slice(0, 3);
              const rest = branches.length - shown.length;
              if (shown.length === 0) return null;
              return (
                <>
                  <span className="text-gray-300">·</span>
                  {shown.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-mono max-w-[120px] truncate">
                      <GitBranch className="w-2.5 h-2.5 shrink-0" />
                      {b}
                    </span>
                  ))}
                  {rest > 0 && (
                    <span className="text-xs text-neutral-400">+{rest}</span>
                  )}
                </>
              );
            })()}
          </div>
          {/* マージフロー表示 */}
          {mergeInfo && (
            <div className="flex items-center gap-1.5 text-xs">
              <GitMerge className="w-3 h-3 text-violet-400 shrink-0" />
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono border border-violet-100 max-w-[120px] truncate">
                {mergeInfo.source}
              </span>
              <span className="text-neutral-400">→</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-mono border border-violet-100 max-w-[120px] truncate">
                {mergeInfo.target}
              </span>
            </div>
          )}
          {/* AI平易化 or 生成ボタン */}
          {s ? (
            <p className="text-sm text-gray-600 leading-snug pt-0.5">
              {s.simplified_message}
            </p>
          ) : (
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {generating ? "生成中..." : "要約を生成する"}
              </button>
              {genError && <span className="text-xs text-red-500">{genError}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {isMerged && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              マージ済み
            </span>
          )}
          <a
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-300 hover:text-gray-500"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* カテゴリバッジ */}
      {(s?.change_categories?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s!.change_categories!.map((cat) => {
            const style = CATEGORY_STYLES[cat] ?? { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
            return (
              <span
                key={cat}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
              >
                {cat}
              </span>
            );
          })}
        </div>
      )}

      {/* 元のコミットメッセージ（折りたたみ） */}
      <div>
        <button
          onClick={() => setShowOriginal((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          {showOriginal ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          原文を見る
        </button>
        {showOriginal && (
          <p className="mt-1.5 font-mono text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 whitespace-pre-wrap">
            {commit.message}
          </p>
        )}
      </div>

      {/* コード変更説明 */}
      {s?.code_explanation && (() => {
        let simple = s.code_explanation;
        try {
          const parsed = JSON.parse(s.code_explanation);
          if (parsed?.simple) simple = parsed.simple;
        } catch { /* plain text fallback */ }
        return <p className="text-sm text-gray-600 leading-relaxed">{simple}</p>;
      })()}

      {/* フロント変更 */}
      {s?.frontend_changes && (
        <div className="bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <p className="text-xs font-medium text-purple-700 mb-1">画面の変化</p>
          <p className="text-sm text-gray-700">{s.frontend_changes}</p>
        </div>
      )}

      {/* 技術バッジ */}
      {((s?.added_technologies?.length ?? 0) > 0 ||
        (s?.removed_technologies?.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {s?.added_technologies?.map((t, i) => (
            <TechBadge key={`add-${i}`} name={t.name} type="added" />
          ))}
          {s?.removed_technologies?.map((t, i) => (
            <TechBadge key={`rm-${i}`} name={t.name} type="removed" />
          ))}
        </div>
      )}

      {/* 変更ファイル */}
      {(commit.changed_files?.length ?? 0) > 0 && (
        <ChangedFileList files={commit.changed_files!} />
      )}

      {/* フッター */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        {s?.message_quality_score != null && (
          <QualityScore score={s.message_quality_score} />
        )}
        <Link href={detailHref}>
          <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3">
            詳細を見る
          </Button>
        </Link>
      </div>
    </div>
  );
}
