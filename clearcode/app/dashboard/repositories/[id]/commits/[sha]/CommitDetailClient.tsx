"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, RefreshCw, Send, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TechBadge from "@/components/TechBadge";
import ChangedFileList from "@/components/ChangedFileList";

type Tab = "summary" | "visual" | "code" | "diff";

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

interface CommitSummary {
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: Technology[] | null;
  removed_technologies: Technology[] | null;
  technology_categories: Record<string, string[]> | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
  change_categories: string[] | null;
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

interface DiffFile {
  filename: string;
  lines: DiffLine[];
}

interface DiffLine {
  type: "added" | "removed" | "context" | "hunk";
  content: string;
  oldNum?: number;
  newNum?: number;
}

function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = [];
  let current: DiffFile | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of raw.split("\n")) {
    if (line.startsWith("diff --git")) {
      if (current) files.push(current);
      current = { filename: "", lines: [] };
    } else if (line.startsWith("+++ b/") && current) {
      current.filename = line.slice(6);
    } else if (line.startsWith("@@ ") && current) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLineNum = parseInt(match[1]);
        newLineNum = parseInt(match[2]);
      }
      current.lines.push({ type: "hunk", content: line });
    } else if (current && current.filename) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        current.lines.push({ type: "added", content: line.slice(1), newNum: newLineNum++ });
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        current.lines.push({ type: "removed", content: line.slice(1), oldNum: oldLineNum++ });
      } else if (!line.startsWith("\\") && !line.startsWith("---") && !line.startsWith("+++")) {
        current.lines.push({ type: "context", content: line.slice(1), oldNum: oldLineNum++, newNum: newLineNum++ });
      }
    }
  }
  if (current) files.push(current);
  return files.filter((f) => f.filename);
}

const EXT_BADGE: Record<string, { bg: string; text: string }> = {
  ts:    { bg: "bg-blue-900",    text: "text-blue-300"    },
  tsx:   { bg: "bg-blue-900",    text: "text-blue-300"    },
  js:    { bg: "bg-yellow-900",  text: "text-yellow-300"  },
  jsx:   { bg: "bg-yellow-900",  text: "text-yellow-300"  },
  py:    { bg: "bg-green-900",   text: "text-green-300"   },
  css:   { bg: "bg-purple-900",  text: "text-purple-300"  },
  scss:  { bg: "bg-purple-900",  text: "text-purple-300"  },
  json:  { bg: "bg-orange-900",  text: "text-orange-300"  },
  md:    { bg: "bg-neutral-700", text: "text-neutral-300" },
  sql:   { bg: "bg-teal-900",    text: "text-teal-300"    },
  yaml:  { bg: "bg-amber-900",   text: "text-amber-300"   },
  yml:   { bg: "bg-amber-900",   text: "text-amber-300"   },
  go:    { bg: "bg-cyan-900",    text: "text-cyan-300"    },
  rs:    { bg: "bg-red-900",     text: "text-red-300"     },
  rb:    { bg: "bg-red-900",     text: "text-red-300"     },
  html:  { bg: "bg-orange-900",  text: "text-orange-300"  },
  sh:    { bg: "bg-green-900",   text: "text-green-300"   },
  vue:   { bg: "bg-emerald-900", text: "text-emerald-300" },
  svelte:{ bg: "bg-red-900",     text: "text-red-300"     },
  toml:  { bg: "bg-amber-900",   text: "text-amber-300"   },
}
const EXT_BADGE_DEFAULT = { bg: "bg-neutral-700", text: "text-neutral-400" }

function DiffFileBlock({ file }: { file: DiffFile }) {
  const [collapsed, setCollapsed] = useState(false)
  const ext = file.filename.split(".").pop()?.toLowerCase() ?? ""
  const badge = EXT_BADGE[ext] ?? EXT_BADGE_DEFAULT
  const addedCount = file.lines.filter((l) => l.type === "added").length
  const removedCount = file.lines.filter((l) => l.type === "removed").length
  const lastSlash = file.filename.lastIndexOf("/")
  const dir = lastSlash >= 0 ? file.filename.slice(0, lastSlash + 1) : ""
  const basename = lastSlash >= 0 ? file.filename.slice(lastSlash + 1) : file.filename

  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden">
      {/* ファイルヘッダー */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-800 gap-3">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${badge.bg} ${badge.text}`}>
            .{ext || "—"}
          </span>
          {dir && (
            <span className="text-neutral-500 text-xs font-mono truncate hidden sm:block">{dir}</span>
          )}
          <span className="text-neutral-100 text-xs font-mono font-semibold truncate">{basename}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {addedCount > 0 && (
            <span className="text-xs font-mono text-green-400">+{addedCount}</span>
          )}
          {removedCount > 0 && (
            <span className="text-xs font-mono text-red-400">-{removedCount}</span>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
          >
            {collapsed ? "展開" : "折りたたむ"}
          </button>
        </div>
      </div>

      {/* diff テーブル */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              {file.lines.map((line, i) => {
                if (line.type === "hunk") {
                  return (
                    <tr key={i} className="bg-blue-50">
                      <td className="w-10 px-2 text-right text-neutral-300 select-none border-r border-neutral-100 py-0.5" />
                      <td className="w-10 px-2 text-right text-neutral-300 select-none border-r border-neutral-100 py-0.5" />
                      <td className="px-3 py-0.5 text-blue-400">{line.content}</td>
                    </tr>
                  )
                }
                return (
                  <tr
                    key={i}
                    className={
                      line.type === "added" ? "bg-green-50" :
                      line.type === "removed" ? "bg-red-50" : "bg-white"
                    }
                  >
                    <td className="w-10 px-2 text-right text-neutral-300 select-none border-r border-neutral-100 py-0.5">
                      {line.type !== "added" ? line.oldNum : ""}
                    </td>
                    <td className="w-10 px-2 text-right text-neutral-300 select-none border-r border-neutral-100 py-0.5">
                      {line.type !== "removed" ? line.newNum : ""}
                    </td>
                    <td className={`px-3 py-0.5 whitespace-pre ${
                      line.type === "added" ? "text-green-800" :
                      line.type === "removed" ? "text-red-800" : "text-neutral-700"
                    }`}>
                      <span className="select-none mr-1 text-neutral-400">
                        {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                      </span>
                      {line.content}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface Props {
  repositoryId: string;
  sha: string;
  repositoryName: string;
}

export default function CommitDetailClient({ repositoryId, sha, repositoryName }: Props) {
  const [commit, setCommit] = useState<CommitDetail | null>(null);
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  const fetchCommit = useCallback(async () => {
    const [commitRes, diffRes] = await Promise.all([
      fetch(`/api/repositories/${repositoryId}/commits?sha=${sha}`),
      fetch(`/api/repositories/${repositoryId}/commits/${sha}`),
    ]);
    if (!commitRes.ok) throw new Error("コミットが見つかりません");
    const commitData = await commitRes.json();
    setCommit(commitData.commit);
    if (diffRes.ok) {
      const diffData = await diffRes.json();
      setDiffFiles(parseDiff(diffData.diff ?? ""));
    }
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
      const res = await fetch(`/api/commits/${commit.id}/regenerate-summary`, { method: "POST" });
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

  const handleNotifySlack = async () => {
    setNotifying(true);
    setNotifyResult(null);
    try {
      const res = await fetch(`/api/repositories/${repositoryId}/commits/${sha}/notify`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setNotifyResult(data.error?.message ?? "送信に失敗しました");
      } else {
        setNotifyResult(`#${data.channel} に送信しました`);
        setTimeout(() => setNotifyResult(null), 4000);
      }
    } finally {
      setNotifying(false);
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
    { key: "code", label: "コードの説明" },
    { key: "diff", label: `差分 (${diffFiles.length}ファイル)` },
  ];

  return (
    <div className="space-y-6">
      {/* ナビゲーション（スクロール追従） */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-white/90 backdrop-blur-sm border-b border-neutral-100 flex items-center justify-between">
        <Link
          href={`/dashboard/repositories/${repositoryId}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black transition-colors bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg px-3 py-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          {repositoryName} に戻る
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Link href="/dashboard" className="hover:text-neutral-700 transition-colors">ホーム</Link>
          <span>/</span>
          <Link href={`/dashboard/repositories/${repositoryId}`} className="hover:text-neutral-700 transition-colors">
            {repositoryName}
          </Link>
          <span>/</span>
          <span className="font-mono text-neutral-600">{sha.slice(0, 7)}</span>
        </div>
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
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
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
        {diffFiles.length > 0 && (
          <ChangedFileList files={diffFiles.map((f) => f.filename)} />
        )}
      </div>

      {/* カテゴリバッジ */}
      {(s?.change_categories?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s!.change_categories!.map((cat) => {
            const style = CATEGORY_STYLES[cat] ?? { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
            return (
              <span
                key={cat}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
              >
                {cat}
              </span>
            );
          })}
        </div>
      )}

      {/* タブ */}
      {s ? (
        <div className="space-y-4">
          <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit flex-wrap">
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

          <div className="bg-white rounded-xl border border-neutral-100 min-h-36">
            {activeTab === "summary" && (
              <div className="p-6 space-y-2">
                <p className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {s.simplified_message}
                </p>
                <p className="text-xs text-neutral-400">AIによる平易化</p>
              </div>
            )}

            {activeTab === "visual" && (
              <div className="p-6">
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
              <div className="p-6 space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed">{s.code_explanation}</p>
              </div>
            )}

            {activeTab === "diff" && (
              <div className="p-4">
                {diffFiles.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-400">差分データがありません</div>
                ) : (
                  <div className="space-y-3">
                    {diffFiles.map((file) => (
                      <DiffFileBlock key={file.filename} file={file} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-8 text-center space-y-3">
          <p className="text-sm text-neutral-400">要約がまだ生成されていません</p>
          {diffFiles.length > 0 && (
            <div className="mt-4 text-left space-y-2">
              <p className="text-xs text-neutral-400 mb-2">差分のみ表示</p>
              {diffFiles.map((file) => (
                <DiffFileBlock key={file.filename} file={file} />
              ))}
            </div>
          )}
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
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
          {regenerating ? "生成中..." : regenerated ? "再生成しました" : "要約を再生成"}
        </Button>

        <Button
          variant="outline"
          className="rounded-full gap-2"
          onClick={handleNotifySlack}
          disabled={notifying}
        >
          <Send className="w-4 h-4" />
          {notifying ? "送信中..." : "Slackに送信"}
        </Button>

        {notifyResult && (
          <span className={`text-xs px-3 py-1 rounded-full ${
            notifyResult.includes("送信しました")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {notifyResult}
          </span>
        )}
      </div>

      {/* ページ下部の戻るリンク */}
      <div className="pt-2 border-t border-neutral-100">
        <Link
          href={`/dashboard/repositories/${repositoryId}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {repositoryName} のコミット一覧に戻る
        </Link>
      </div>
    </div>
  );
}
