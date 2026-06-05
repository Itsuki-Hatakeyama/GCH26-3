import { ImageResponse } from 'next/og'

type DiffLine = {
  type: 'added' | 'removed' | 'context'
  content: string
}

function parseDiffLines(raw: string): DiffLine[] {
  const result: DiffLine[] = []
  for (const line of raw.split('\n')) {
    if (
      line.startsWith('diff ') ||
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('@@') ||
      line.startsWith('\\')
    ) continue
    if (line.startsWith('+')) {
      result.push({ type: 'added', content: line.slice(1) })
    } else if (line.startsWith('-')) {
      result.push({ type: 'removed', content: line.slice(1) })
    } else if (line.length > 0) {
      result.push({ type: 'context', content: line.slice(1) || '' })
    }
  }
  return result.slice(0, 80)
}

function splitDiffByFile(diff: string): { filename: string; raw: string }[] {
  const files: { filename: string; raw: string }[] = []
  const chunks = diff.split(/(?=^diff --git )/m)
  for (const chunk of chunks) {
    if (!chunk.trim()) continue
    const match = chunk.match(/^\+\+\+ b\/(.+)$/m) ?? chunk.match(/^diff --git a\/.+ b\/(.+)$/m)
    const filename = match?.[1] ?? 'unknown'
    files.push({ filename, raw: chunk })
  }
  return files
}

async function renderImage(lines: DiffLine[], title: string): Promise<Buffer> {
  const lineHeight = 22
  const headerHeight = 48
  const paddingY = 20
  const height = Math.max(200, lines.length * lineHeight + headerHeight + paddingY * 2)

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1117',
          width: '100%',
          height: '100%',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #30363d',
          }}
        >
          <span style={{ color: '#e6edf3', fontSize: '14px', fontWeight: 'bold' }}>
            {title}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                backgroundColor:
                  line.type === 'added'
                    ? 'rgba(46, 160, 67, 0.15)'
                    : line.type === 'removed'
                    ? 'rgba(248, 81, 73, 0.15)'
                    : 'transparent',
                paddingLeft: '8px',
                paddingRight: '8px',
                borderLeft: `3px solid ${
                  line.type === 'added'
                    ? '#3fb950'
                    : line.type === 'removed'
                    ? '#f85149'
                    : '#30363d'
                }`,
                height: `${lineHeight}px`,
              }}
            >
              <span
                style={{
                  color:
                    line.type === 'added'
                      ? '#3fb950'
                      : line.type === 'removed'
                      ? '#f85149'
                      : '#8b949e',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre',
                  lineHeight: `${lineHeight}px`,
                }}
              >
                {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 800, height }
  )

  const arrayBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ファイル単位で画像化して返す
export async function generateDiffImages(diff: string): Promise<{ filename: string; buffer: Buffer }[]> {
  const files = splitDiffByFile(diff)
  const results: { filename: string; buffer: Buffer }[] = []
  for (const f of files) {
    const lines = parseDiffLines(f.raw)
    if (lines.length === 0) continue
    const buffer = await renderImage(lines, f.filename)
    results.push({ filename: f.filename, buffer })
  }
  return results
}

// 後方互換用（diff 全体を1枚に）
export async function generateDiffImage(diff: string, title: string): Promise<Buffer> {
  const lines = parseDiffLines(diff)
  return renderImage(lines, title)
}
