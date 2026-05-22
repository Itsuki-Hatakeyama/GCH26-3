"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechBadge from "@/components/TechBadge";
import QualityScore from "@/components/QualityScore";

interface Technology {
  name: string;
  category: string;
  language?: string;
}

interface CommitSummaryData {
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: Technology[] | null;
  removed_technologies: Technology[] | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
}

export interface CommitWithSummary {
  id: string;
  sha: string;
  message: string;
  author_name: string;
  committed_at: string;
  html_url: string;
  repository_id: string;
  // Supabase は一対多で返すので配列（UNIQUE制約があっても）
  commit_summaries: CommitSummaryData[];
}

interface CommitCardProps {
  commit: CommitWithSummary;
  isUnread?: boolean;
}

export default function CommitCard({ commit, isUnread = false }: CommitCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const s = commit.commit_summaries[0] ?? null;

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
      {/* 平易化メッセージ */}
      <div className="flex items-start justify-between gap-3">
        <p
          className={`text-base font-semibold leading-snug ${
            s ? "text-gray-900" : "text-gray-400 italic"
          }`}
        >
          {s ? s.simplified_message : "要約を生成中..."}
        </p>
        <a
          href={commit.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

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

      {/* フッター */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{commit.author_name}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span className="font-mono">{commit.sha.slice(0, 7)}</span>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
