"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechBadge from "@/components/TechBadge";
import QualityScore from "@/components/QualityScore";
import ChangedFileList from "@/components/ChangedFileList";

interface Technology {
  name: string;
  category: string;
  language?: string;
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
  // Supabase は一対多で返すので配列（UNIQUE制約があっても）
  commit_summaries: CommitSummaryData[];
}

interface CommitCardProps {
  commit: CommitWithSummary;
  isUnread?: boolean;
}

export default function CommitCard({ commit, isUnread = false }: CommitCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const s = commit.commit_summaries?.[0] ?? null;

  const date = new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(commit.committed_at));

  return (
    <div
      className={`rounded-xl border p-5 space-y-3 ${
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
          {/* 著者 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="w-3 h-3 shrink-0" />
            <span className="font-medium">{commit.author_name}</span>
            <span className="text-gray-300">·</span>
            <span>{date}</span>
            <span className="text-gray-300">·</span>
            <span className="font-mono text-gray-400">{commit.sha.slice(0, 7)}</span>
          </div>
          {/* AI平易化 */}
          {s && (
            <p className="text-sm text-gray-600 leading-snug pt-0.5">
              {s.simplified_message}
            </p>
          )}
        </div>
        <a
          href={commit.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
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
      {s?.code_explanation && (
        <p className="text-sm text-gray-600 leading-relaxed">{s.code_explanation}</p>
      )}

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
        <Link
          href={`/dashboard/repositories/${commit.repository_id}/commits/${commit.sha}`}
        >
          <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3">
            詳細を見る
          </Button>
        </Link>
      </div>
    </div>
  );
}
