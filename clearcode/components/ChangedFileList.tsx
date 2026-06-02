"use client"

import { useState } from "react"

const EXT_STYLES: Record<string, { bg: string; text: string }> = {
  ts:   { bg: "bg-blue-100",   text: "text-blue-700"   },
  tsx:  { bg: "bg-blue-100",   text: "text-blue-700"   },
  js:   { bg: "bg-yellow-100", text: "text-yellow-700" },
  jsx:  { bg: "bg-yellow-100", text: "text-yellow-700" },
  py:   { bg: "bg-green-100",  text: "text-green-700"  },
  css:  { bg: "bg-purple-100", text: "text-purple-700" },
  scss: { bg: "bg-purple-100", text: "text-purple-700" },
  json: { bg: "bg-orange-100", text: "text-orange-700" },
  md:   { bg: "bg-gray-100",   text: "text-gray-500"   },
  sql:  { bg: "bg-teal-100",   text: "text-teal-700"   },
  yaml: { bg: "bg-amber-100",  text: "text-amber-700"  },
  yml:  { bg: "bg-amber-100",  text: "text-amber-700"  },
  go:   { bg: "bg-cyan-100",   text: "text-cyan-700"   },
  rs:   { bg: "bg-red-100",    text: "text-red-700"    },
  rb:   { bg: "bg-red-100",    text: "text-red-700"    },
  html: { bg: "bg-orange-100", text: "text-orange-700" },
  sh:   { bg: "bg-green-100",  text: "text-green-700"  },
  vue:  { bg: "bg-emerald-100",text: "text-emerald-700"},
  svelte:{ bg:"bg-red-100",    text: "text-red-700"    },
  env:  { bg: "bg-gray-100",   text: "text-gray-500"   },
  toml: { bg: "bg-amber-100",  text: "text-amber-700"  },
  lock: { bg: "bg-gray-100",   text: "text-gray-400"   },
}

const DEFAULT_STYLE = { bg: "bg-gray-100", text: "text-gray-500" }
const VISIBLE_COUNT = 3

function getStyle(filename: string) {
  const parts = filename.split(".")
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : ""
  return EXT_STYLES[ext] ?? DEFAULT_STYLE
}

function FileBadge({ filename }: { filename: string }) {
  const { bg, text } = getStyle(filename)
  const basename = filename.split("/").pop() ?? filename
  return (
    <span
      title={filename}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono truncate max-w-[180px] ${bg} ${text}`}
    >
      {basename}
    </span>
  )
}

interface Props {
  files: string[]
}

export default function ChangedFileList({ files }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (files.length === 0) return null

  const visible = expanded ? files : files.slice(0, VISIBLE_COUNT)
  const hiddenCount = files.length - VISIBLE_COUNT

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((f) => (
        <FileBadge key={f} filename={f} />
      ))}
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true) }}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          +{hiddenCount}
        </button>
      )}
      {expanded && files.length > VISIBLE_COUNT && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(false) }}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          閉じる
        </button>
      )}
    </div>
  )
}
