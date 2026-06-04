"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GitBranch, User, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export interface GraphBranchInfo {
  name: string
  lastCommitSha: string
}

interface GraphCommit {
  sha: string
  title: string
  author_name: string
  committed_at: string
  html_url: string
  branchName: string
}

interface LaneColor {
  dot: string
  line: string
  badge: string
  badgeText: string
}

const LANE_COLORS: LaneColor[] = [
  { dot: "bg-blue-500",    line: "bg-blue-400",    badge: "bg-blue-100",    badgeText: "text-blue-700"    },
  { dot: "bg-green-500",   line: "bg-green-400",   badge: "bg-green-100",   badgeText: "text-green-700"   },
  { dot: "bg-purple-500",  line: "bg-purple-400",  badge: "bg-purple-100",  badgeText: "text-purple-700"  },
  { dot: "bg-orange-500",  line: "bg-orange-400",  badge: "bg-orange-100",  badgeText: "text-orange-700"  },
  { dot: "bg-pink-500",    line: "bg-pink-400",    badge: "bg-pink-100",    badgeText: "text-pink-700"    },
  { dot: "bg-teal-500",    line: "bg-teal-400",    badge: "bg-teal-100",    badgeText: "text-teal-700"    },
  { dot: "bg-red-500",     line: "bg-red-400",     badge: "bg-red-100",     badgeText: "text-red-700"     },
  { dot: "bg-yellow-500",  line: "bg-yellow-400",  badge: "bg-yellow-100",  badgeText: "text-yellow-700"  },
]

const LANE_WIDTH = 20
const MAX_BRANCHES = 8

interface Props {
  repositoryId: string
  branches: GraphBranchInfo[]
  defaultBranch: string
}

export default function BranchGraph({ repositoryId, branches, defaultBranch }: Props) {
  const [branchCommits, setBranchCommits] = useState<Record<string, GraphCommit[]>>({})
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  const visibleBranches = [
    ...branches.filter((b) => b.name === defaultBranch),
    ...branches.filter((b) => b.name !== defaultBranch),
  ].slice(0, MAX_BRANCHES)

  useEffect(() => {
    if (branches.length === 0) return
    let cancelled = false
    setLoading(true)

    Promise.all(
      visibleBranches.map((b) =>
        fetch(`/api/repositories/${repositoryId}/branches/${encodeURIComponent(b.name)}`)
          .then((r) => r.json())
          .then((d) => ({ name: b.name, commits: (d.commits ?? []) as GraphCommit[] }))
          .catch(() => ({ name: b.name, commits: [] }))
      )
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, GraphCommit[]> = {}
      results.forEach(({ name, commits }) => { map[name] = commits })
      setBranchCommits(map)
      setLoading(false)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId, branches.map((b) => b.name).join(",")])

  // ── ユニークコミットを全ブランチから収集し時系列順に並べる ──
  const allRows: { sha: string; branches: string[]; commit: GraphCommit }[] = []
  const seenSha = new Set<string>()

  const allCommits = visibleBranches.flatMap((b) =>
    (branchCommits[b.name] ?? []).map((c) => ({ ...c, branchName: b.name }))
  ).sort((a, b) => new Date(b.committed_at).getTime() - new Date(a.committed_at).getTime())

  for (const c of allCommits) {
    if (seenSha.has(c.sha)) {
      const row = allRows.find((r) => r.sha === c.sha)
      if (row && !row.branches.includes(c.branchName)) row.branches.push(c.branchName)
    } else {
      seenSha.add(c.sha)
      allRows.push({ sha: c.sha, branches: [c.branchName], commit: c })
    }
  }

  // ブランチが「このrow以前に」コミットを持つかどうか（ライン描画用）
  const branchFirstRow: Record<string, number> = {}
  const branchLastRow: Record<string, number> = {}
  visibleBranches.forEach((b) => {
    allRows.forEach((row, i) => {
      if (row.branches.includes(b.name)) {
        if (branchFirstRow[b.name] === undefined) branchFirstRow[b.name] = i
        branchLastRow[b.name] = i
      }
    })
  })

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      .format(new Date(iso))

  return (
    <section>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">ブランチ</h2>
          <span className="text-xs text-neutral-400">{branches.length}件</span>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          {collapsed ? "展開" : "折りたたむ"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* ブランチ凡例 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {visibleBranches.map((b, i) => {
              const color = LANE_COLORS[i % LANE_COLORS.length]
              return (
                <span
                  key={b.name}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono ${color.badge} ${color.badgeText}`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot} shrink-0`} />
                  {b.name}
                  {b.name === defaultBranch && (
                    <span className="opacity-60 text-[10px]">default</span>
                  )}
                </span>
              )
            })}
            {branches.length > MAX_BRANCHES && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-gray-100 text-gray-500">
                +{branches.length - MAX_BRANCHES}件
              </span>
            )}
          </div>

          {/* グラフ本体 */}
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              ブランチ情報を取得中...
            </div>
          ) : allRows.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4">コミットがありません</p>
          ) : (
            <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                {allRows.map((row, rowIdx) => {
                  const date = formatDate(row.commit.committed_at)
                  return (
                    <div
                      key={row.sha}
                      className="flex items-center gap-3 px-4 hover:bg-neutral-50 transition-colors group"
                      style={{ minHeight: 44 }}
                    >
                      {/* レーン */}
                      <div className="flex shrink-0" style={{ width: visibleBranches.length * LANE_WIDTH }}>
                        {visibleBranches.map((b, laneIdx) => {
                          const color = LANE_COLORS[laneIdx % LANE_COLORS.length]
                          const hasDot = row.branches.includes(b.name)
                          const first = branchFirstRow[b.name] ?? Infinity
                          const last = branchLastRow[b.name] ?? -Infinity
                          const lineAbove = rowIdx > first
                          const lineBelow = rowIdx < last

                          return (
                            <div
                              key={b.name}
                              className="relative flex items-center justify-center"
                              style={{ width: LANE_WIDTH, height: 44 }}
                            >
                              {/* 上方向ライン */}
                              {lineAbove && (
                                <div
                                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-0.5 ${color.line}`}
                                  style={{ height: hasDot ? "50%" : "100%" }}
                                />
                              )}
                              {/* 下方向ライン */}
                              {lineBelow && (
                                <div
                                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 ${color.line}`}
                                  style={{ height: hasDot ? "50%" : "100%" }}
                                />
                              )}
                              {/* コミットドット */}
                              {hasDot && (
                                <div
                                  className={`relative z-10 w-2.5 h-2.5 rounded-full border-2 border-white ${color.dot}`}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* コミット情報 */}
                      <div className="min-w-0 flex-1 py-2">
                        <Link
                          href={`/dashboard/repositories/${repositoryId}/commits/${row.sha}`}
                          className="block"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate group-hover:text-black transition-colors">
                            {row.commit.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-xs text-neutral-400">
                              <User className="w-2.5 h-2.5" />
                              {row.commit.author_name}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-neutral-400">
                              <Clock className="w-2.5 h-2.5" />
                              {date}
                            </span>
                            <span className="text-xs font-mono text-neutral-300">{row.sha.slice(0, 7)}</span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
