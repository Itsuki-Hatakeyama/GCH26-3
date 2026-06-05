import { WebClient } from '@slack/web-api'
import { decrypt } from '@/lib/crypto'
import { generateDiffImages } from '@/lib/diff-image'

interface NotifyParams {
  accessTokenEncrypted: string
  channelId: string
  repoName: string
  commitSha: string
  authorName: string
  simplifiedMessage: string
  codeExplanation: string
  commitUrl: string
  diff?: string
  beforeImage?: Buffer
  afterImage?: Buffer
}

export async function sendCommitNotification(params: NotifyParams): Promise<void> {
  const token = params.accessTokenEncrypted
    ? await decrypt(params.accessTokenEncrypted)
    : process.env.SLACK_BOT_TOKEN ?? ''

  const shortSha = params.commitSha.slice(0, 7)

  const codeExpLines: string[] = []
  try {
    const parsed = JSON.parse(params.codeExplanation) as {
      simple?: string
      technical?: string
      terms?: { term: string; description: string }[]
    }
    if (parsed.simple)    codeExpLines.push(`🙋 *非エンジニア向け*\n${parsed.simple}`)
    if (parsed.technical) codeExpLines.push(`🛠 *エンジニア向け*\n${parsed.technical}`)
    if (parsed.terms && parsed.terms.length > 0) {
      const termLines = parsed.terms.map((t) => `• *${t.term}*: ${t.description}`).join('\n')
      codeExpLines.push(`📖 *専門用語*\n${termLines}`)
    }
  } catch {
    if (params.codeExplanation) codeExpLines.push(params.codeExplanation)
  }

  const text = [
    `📦 *${params.repoName}* に新しい変更が届きました`,
    '',
    `*${params.simplifiedMessage}*`,
    '',
    ...codeExpLines,
    '',
    `👤 ${params.authorName}  |  コミット \`${shortSha}\``,
  ].join('\n')

  const client = new WebClient(token)

  // 送信するファイル一覧を組み立て
  type FileEntry = { filename: string; file: Buffer; title: string }
  const fileUploads: FileEntry[] = []

  if (params.diff) {
    try {
      const diffImages = await generateDiffImages(params.diff)
      for (const img of diffImages) {
        const safeName = img.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
        fileUploads.push({ filename: `${safeName}.png`, file: img.buffer, title: img.filename })
      }
    } catch (err) {
      console.error('diff image generation failed:', err)
    }
  }

  if (params.beforeImage) {
    fileUploads.push({ filename: 'before.png', file: params.beforeImage, title: '変更前' })
  }
  if (params.afterImage) {
    fileUploads.push({ filename: 'after.png', file: params.afterImage, title: '変更後' })
  }

  if (fileUploads.length > 0) {
    for (let i = 0; i < fileUploads.length; i++) {
      const f = fileUploads[i]
      try {
        await client.filesUploadV2({
          channel_id: params.channelId,
          filename: f.filename,
          file: f.file,
          title: f.title,
          initial_comment: i === 0 ? text : undefined,
        })
      } catch (err) {
        console.error(`file upload failed (${f.filename}):`, err)
        if (i === 0) {
          await client.chat.postMessage({ channel: params.channelId, text })
        }
      }
    }
    return
  }

  await client.chat.postMessage({ channel: params.channelId, text })
}
