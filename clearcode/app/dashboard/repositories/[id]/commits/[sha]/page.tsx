'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface CommitSummary {
  simplified_message: string
  code_explanation: string
  message_quality_score: number | null
  message_quality_feedback: string | null
}

interface Commit {
  id: string
  sha: string
  message: string
  author_name: string
  author_email: string
  committed_at: string
  html_url: string
  commit_summaries: CommitSummary | null
}

interface DiffFile {
  filename: string
  lines: DiffLine[]
}

interface DiffLine {
  type: 'added' | 'removed' | 'context' | 'hunk'
  content: string
  oldNum?: number
  newNum?: number
}

function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = []
  let current: DiffFile | null = null
  let oldLineNum = 0
  let newLineNum = 0

  for (const line of raw.split('\n')) {
    if (line.startsWith('diff --git')) {
      if (current) files.push(current)
      current = { filename: '', lines: [] }
    } else if (line.startsWith('+++ b/') && current) {
      current.filename = line.slice(6)
    } else if (line.startsWith('@@ ') && current) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        oldLineNum = parseInt(match[1])
        newLineNum = parseInt(match[2])
      }
      current.lines.push({ type: 'hunk', content: line })
    } else if (current && current.filename) {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        current.lines.push({ type: 'added', content: line.slice(1), newNum: newLineNum++ })
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        current.lines.push({ type: 'removed', content: line.slice(1), oldNum: oldLineNum++ })
      } else if (!line.startsWith('\\') && !line.startsWith('---') && !line.startsWith('+++')) {
        current.lines.push({ type: 'context', content: line.slice(1), oldNum: oldLineNum++, newNum: newLineNum++ })
      }
    }
  }
  if (current) files.push(current)
  return files.filter(f => f.filename)
}

export default function CommitDetailPage() {
  const { id, sha } = useParams<{ id: string; sha: string }>()
  const [commit, setCommit] = useState<Commit | null>(null)
  const [repoName, setRepoName] = useState('')
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/repositories/${id}/commits/${sha}`)
      .then(async (res) => {
        if (!res.ok) { setError('コミットが見つかりません'); setLoading(false); return }
        const data = await res.json()
        setCommit(data.commit)
        setRepoName(data.repo?.name ?? '')
        setDiffFiles(parseDiff(data.diff ?? ''))
        setLoading(false)
      })
      .catch(() => { setError('読み込みに失敗しました'); setLoading(false) })
  }, [id, sha])

  if (loading) return <div className="text-center py-20 text-neutral-400">読み込み中...</div>
  if (error || !commit) return <div className="text-center py-20 text-neutral-400">{error || 'コミットが見つかりません'}</div>

  const summary = commit.commit_summaries
  const date = new Date(commit.committed_at).toLocaleString('ja-JP')
  const shortSha = commit.sha.slice(0, 7)

  return (
    <div className="max-w-4xl mx-auto">
      {/* パンくず */}
      <div className="text-xs text-neutral-400 mb-6">
        <Link href="/dashboard" className="hover:text-black">ホーム</Link>
        {' / '}
        <Link href={`/dashboard/repositories/${id}`} className="hover:text-black">{repoName}</Link>
        {' / '}
        <span className="font-mono">{shortSha}</span>
      </div>

      {/* コミット情報 */}
      <div className="bg-white rounded-xl border border-neutral-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-lg font-semibold text-black leading-snug flex-1 pr-4">
            {summary?.simplified_message ?? commit.message}
          </h1>
          {summary?.message_quality_score != null && (
            <span className={`text-sm font-medium px-3 py-1 rounded-full flex-shrink-0 ${
              summary.message_quality_score >= 70 ? 'bg-green-100 text-green-700' :
              summary.message_quality_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {summary.message_quality_score}点
            </span>
          )}
        </div>

        {summary?.code_explanation && (
          <p className="text-sm text-neutral-600 mb-4 leading-relaxed">{summary.code_explanation}</p>
        )}

        {summary?.message_quality_feedback && (
          <div className="bg-neutral-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-neutral-500 font-medium mb-1">コミットメッセージ改善提案</p>
            <p className="text-sm text-neutral-700">{summary.message_quality_feedback}</p>
          </div>
        )}

        <div className="border-t border-neutral-100 pt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
          <span>元メッセージ: <span className="font-mono text-neutral-600">{commit.message.split('\n')[0]}</span></span>
          <span>{commit.author_name} &lt;{commit.author_email}&gt;</span>
          <span>{date}</span>
          <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-mono">{shortSha}</a>
        </div>
      </div>

      {/* diff */}
      {diffFiles.length === 0 ? (
        <div className="text-center py-10 text-neutral-400 text-sm">差分データがありません</div>
      ) : (
        <div className="space-y-4">
          {diffFiles.map((file) => (
            <div key={file.filename} className="rounded-xl border border-neutral-200 overflow-hidden">
              {/* ファイル名ヘッダー */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2">
                <span className="text-xs font-mono text-neutral-700">{file.filename}</span>
              </div>
              {/* diff 行 */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse">
                  <tbody>
                    {file.lines.map((line, i) => {
                      if (line.type === 'hunk') {
                        return (
                          <tr key={i} className="bg-blue-50">
                            <td className="w-10 text-right pr-2 text-neutral-400 select-none border-r border-neutral-200 py-0.5 px-2" colSpan={2}></td>
                            <td className="py-0.5 px-3 text-blue-400">{line.content}</td>
                          </tr>
                        )
                      }
                      return (
                        <tr key={i} className={
                          line.type === 'added' ? 'bg-green-50' :
                          line.type === 'removed' ? 'bg-red-50' :
                          'bg-white'
                        }>
                          <td className="w-10 text-right pr-2 text-neutral-300 select-none border-r border-neutral-100 py-0.5 px-2">
                            {line.type !== 'added' ? line.oldNum : ''}
                          </td>
                          <td className="w-10 text-right pr-2 text-neutral-300 select-none border-r border-neutral-100 py-0.5 px-2">
                            {line.type !== 'removed' ? line.newNum : ''}
                          </td>
                          <td className={`py-0.5 px-3 whitespace-pre ${
                            line.type === 'added' ? 'text-green-800' :
                            line.type === 'removed' ? 'text-red-800' :
                            'text-neutral-700'
                          }`}>
                            <span className="select-none mr-1">
                              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                            </span>
                            {line.content}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
