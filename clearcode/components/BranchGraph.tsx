"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GitBranch, GitMerge, User, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react"

export interface GraphBranchInfo {
  name: string
  lastCommitSha: string
}

interface RawCommit {
  sha: string
  title: string
  author_name: string
  committed_at: string
  html_url: string
  parents: string[]
}

interface PlacedCommit {
  sha: string
  title: string
  author_name: string
  committed_at: string
  html_url: string
  parents: string[]
  lane: number
  isMerge: boolean
  mergeFromLane: number | null // lane the merged branch came from
  branchName: string
}

const LANE_COLORS = [
  { dot: "#3b82f6", line: "#93c5fd", badge: "bg-blue-100",    badgeText: "text-blue-700"    },
  { dot: "#22c55e", line: "#86efac", badge: "bg-green-100",   badgeText: "text-green-700"   },
  { dot: "#a855f7", line: "#d8b4fe", badge: "bg-purple-100",  badgeText: "text-purple-700"  },
  { dot: "#f97316", line: "#fdba74", badge: "bg-orange-100",  badgeText: "text-orange-700"  },
  { dot: "#ec4899", line: "#f9a8d4", badge: "bg-pink-100",    badgeText: "text-pink-700"    },
  { dot: "#14b8a6", line: "#5eead4", badge: "bg-teal-100",    badgeText: "text-teal-700"    },
  { dot: "#ef4444", line: "#fca5a5", badge: "bg-red-100",     badgeText: "text-red-700"     },
  { dot: "#eab308", line: "#fde047", badge: "bg-yellow-100",  badgeText: "text-yellow-700"  },
]

const MAX_BRANCHES = 8
const ROW_H = 48
const LANE_W = 20
const DOT_R = 5

interface Props {
  repositoryId: string
  branches: GraphBranchInfo[]
  defaultBranch: string
}

function parseMergedBranchName(title: string): string | null {
  // "Merge branch 'feature/x' into main"
  const m1 = title.match(/Merge branch '([^']+)'/)
  if (m1) return m1[1]
  // "Merge pull request #N from user/branch"
  const m2 = title.match(/Merge pull request #\d+ from [^/]+\/(.+)/)
  if (m2) return m2[1]
  return null
}

export default function BranchGraph({ repositoryId, branches, defaultBranch }: Props) {
  const [branchCommits, setBranchCommits] = useState<Record<string, RawCommit[]>>({})
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
          .then((d) => ({ name: b.name, commits: (d.commits ?? []) as RawCommit[] }))
          .catch(() => ({ name: b.name, commits: [] as RawCommit[] }))
      )
    ).then((results) => {
      if (cancelled) return
      const map: Record<string, RawCommit[]> = {}
      results.forEach(({ name, commits }) => { map[name] = commits })
      setBranchCommits(map)
      setLoading(false)
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId, branches.map((b) => b.name).join(",")])

  // ── Build graph ──
  const placed = buildGraph(visibleBranches, branchCommits, defaultBranch)
  const laneCount = placed.reduce((mx, r) => Math.max(mx, r.lane + 1), 1)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
      .format(new Date(iso))

  const svgW = laneCount * LANE_W

  return (
    <section>
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
          {/* 凡例 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {visibleBranches.map((b, i) => {
              const color = LANE_COLORS[i % LANE_COLORS.length]
              return (
                <span
                  key={b.name}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono ${color.badge} ${color.badgeText}`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color.dot }} />
                  {b.name}
                  {b.name === defaultBranch && <span className="opacity-60 text-[10px]">default</span>}
                </span>
              )
            })}
            {branches.length > MAX_BRANCHES && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-gray-100 text-gray-500">
                +{branches.length - MAX_BRANCHES}件
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              ブランチ情報を取得中...
            </div>
          ) : placed.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4">コミットがありません</p>
          ) : (
            <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <div className="relative" style={{ minWidth: svgW + 300 }}>
                  {/* SVG overlay for connecting lines */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width="100%"
                    height={placed.length * ROW_H}
                    style={{ zIndex: 0 }}
                  >
                    {placed.map((row, rowIdx) => renderSvgLines(row, rowIdx, placed, visibleBranches))}
                  </svg>

                  {/* Rows */}
                  {placed.map((row, rowIdx) => {
                    const branchIdx = visibleBranches.findIndex((b) => b.name === row.branchName)
                    const color = LANE_COLORS[branchIdx >= 0 ? branchIdx % LANE_COLORS.length : 0]
                    const date = formatDate(row.committed_at)

                    return (
                      <div
                        key={row.sha + rowIdx}
                        className="flex items-center gap-3 px-4 hover:bg-neutral-50 transition-colors group relative"
                        style={{ height: ROW_H, zIndex: 1 }}
                      >
                        {/* Lane area */}
                        <div className="shrink-0 relative" style={{ width: svgW, height: ROW_H }}>
                          {/* Dot */}
                          <div
                            className="absolute rounded-full border-2 border-white"
                            style={{
                              width: DOT_R * 2,
                              height: DOT_R * 2,
                              left: row.lane * LANE_W + LANE_W / 2 - DOT_R,
                              top: ROW_H / 2 - DOT_R,
                              background: color.dot,
                              zIndex: 2,
                            }}
                          />
                          {/* Merge icon overlay */}
                          {row.isMerge && (
                            <div
                              className="absolute flex items-center justify-center"
                              style={{
                                width: DOT_R * 2,
                                height: DOT_R * 2,
                                left: row.lane * LANE_W + LANE_W / 2 - DOT_R,
                                top: ROW_H / 2 - DOT_R,
                                zIndex: 3,
                              }}
                            >
                              <GitMerge className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Commit info */}
                        <div className="min-w-0 flex-1 py-2">
                          <Link
                            href={`/dashboard/repositories/${repositoryId}/commits/${row.sha}`}
                            className="block"
                          >
                            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-black transition-colors">
                              {row.isMerge && (
                                <span className="inline-flex items-center mr-1.5">
                                  <GitMerge className="w-3 h-3 text-neutral-400 mr-0.5" />
                                </span>
                              )}
                              {row.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <User className="w-2.5 h-2.5" />
                                {row.author_name}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <Clock className="w-2.5 h-2.5" />
                                {date}
                              </span>
                              <span className="text-xs font-mono text-neutral-300">{row.sha.slice(0, 7)}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${color.badge} ${color.badgeText}`}
                              >
                                {row.branchName}
                              </span>
                            </div>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── Graph layout algorithm ──
function buildGraph(
  visibleBranches: GraphBranchInfo[],
  branchCommits: Record<string, RawCommit[]>,
  defaultBranch: string
): PlacedCommit[] {
  // Assign lanes: default branch = 0, others = 1,2,...
  const laneOf: Record<string, number> = {}
  visibleBranches.forEach((b, i) => {
    laneOf[b.name] = i
  })

  // Build sha→commit map and sha→branches map
  const shaToRaw = new Map<string, RawCommit>()
  const shaToBranches = new Map<string, string[]>()

  for (const b of visibleBranches) {
    for (const c of branchCommits[b.name] ?? []) {
      shaToRaw.set(c.sha, c)
      if (!shaToBranches.has(c.sha)) shaToBranches.set(c.sha, [])
      shaToBranches.get(c.sha)!.push(b.name)
    }
  }

  // Collect all commits sorted newest first
  const allShas = Array.from(shaToRaw.keys())
  allShas.sort((a, b) => {
    const ta = new Date(shaToRaw.get(a)!.committed_at).getTime()
    const tb = new Date(shaToRaw.get(b)!.committed_at).getTime()
    return tb - ta
  })

  // For each commit, pick primary branch (prefer default, else first in visibleBranches order)
  function primaryBranch(sha: string): string {
    const bs = shaToBranches.get(sha) ?? []
    if (bs.includes(defaultBranch)) return defaultBranch
    // pick earliest in visibleBranches order
    let best = bs[0]
    let bestIdx = Infinity
    for (const b of bs) {
      const idx = visibleBranches.findIndex((vb) => vb.name === b)
      if (idx < bestIdx) { bestIdx = idx; best = b }
    }
    return best ?? bs[0]
  }

  const placed: PlacedCommit[] = []

  for (const sha of allShas) {
    const raw = shaToRaw.get(sha)!
    const branch = primaryBranch(sha)
    const lane = laneOf[branch] ?? 0
    const isMerge = raw.parents.length >= 2

    // Find mergeFromLane: look for second parent and figure out its branch
    let mergeFromLane: number | null = null
    if (isMerge) {
      // Try to get branch from title
      const mergedName = parseMergedBranchName(raw.title)
      if (mergedName) {
        const idx = visibleBranches.findIndex((b) => b.name === mergedName || b.name.endsWith("/" + mergedName))
        if (idx >= 0) mergeFromLane = idx
      }
      // Fallback: find second parent's branch
      if (mergeFromLane === null && raw.parents[1]) {
        const secondParentBranches = shaToBranches.get(raw.parents[1]) ?? []
        for (const b of secondParentBranches) {
          if (b !== branch) {
            mergeFromLane = laneOf[b] ?? null
            break
          }
        }
      }
    }

    placed.push({
      ...raw,
      lane,
      isMerge,
      mergeFromLane,
      branchName: branch,
    })
  }

  return placed
}

function renderSvgLines(
  row: PlacedCommit,
  rowIdx: number,
  allRows: PlacedCommit[],
  visibleBranches: GraphBranchInfo[]
): React.ReactNode {
  const elements: React.ReactNode[] = []
  const cx = row.lane * LANE_W + LANE_W / 2
  const cy = rowIdx * ROW_H + ROW_H / 2

  // Draw vertical line up to previous row on same lane
  const prevOnSameLane = allRows.slice(0, rowIdx).findLastIndex((r) => r.lane === row.lane)
  if (prevOnSameLane >= 0) {
    const prevCy = prevOnSameLane * ROW_H + ROW_H / 2
    const color = LANE_COLORS[row.lane % LANE_COLORS.length]
    elements.push(
      <line
        key={`up-${row.sha}`}
        x1={cx} y1={cy - DOT_R}
        x2={cx} y2={prevCy + DOT_R}
        stroke={color.line}
        strokeWidth={2}
      />
    )
  }

  // Draw vertical line down to next row on same lane
  const nextOnSameLane = allRows.findIndex((r, i) => i > rowIdx && r.lane === row.lane)
  if (nextOnSameLane >= 0) {
    const nextCy = nextOnSameLane * ROW_H + ROW_H / 2
    const color = LANE_COLORS[row.lane % LANE_COLORS.length]
    elements.push(
      <line
        key={`down-${row.sha}`}
        x1={cx} y1={cy + DOT_R}
        x2={cx} y2={nextCy - DOT_R}
        stroke={color.line}
        strokeWidth={2}
      />
    )
  }

  // Draw merge curve: from mergeFromLane to this lane
  if (row.isMerge && row.mergeFromLane !== null && row.mergeFromLane !== row.lane) {
    const fromX = row.mergeFromLane * LANE_W + LANE_W / 2
    const toX = cx
    const fromColor = LANE_COLORS[row.mergeFromLane % LANE_COLORS.length]
    // Bezier curve from merge source lane to this commit dot
    const midY = cy - ROW_H * 0.4
    elements.push(
      <path
        key={`merge-${row.sha}`}
        d={`M ${fromX} ${cy} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${cy - DOT_R}`}
        stroke={fromColor.line}
        strokeWidth={2}
        fill="none"
        strokeDasharray="4 2"
      />
    )
  }

  return <g key={`g-${row.sha}-${rowIdx}`}>{elements}</g>
}
