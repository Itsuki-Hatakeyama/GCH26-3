import { WebClient } from '@slack/web-api'
import { decrypt } from '@/lib/crypto'
import { generateDiffImage } from '@/lib/diff-image'

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
  const text = [
    `📦 *${params.repoName}* に新しい変更が届きました`,
    '',
    `*${params.simplifiedMessage}*`,
    '',
    params.codeExplanation,
    '',
    `👤 ${params.authorName}  |  コミット \`${shortSha}\``,
  ].join('\n')

  const client = new WebClient(token)

  // 送信するファイル一覧を組み立て
  type FileEntry = { filename: string; file: Buffer; title: string }
  const fileUploads: FileEntry[] = []

  if (params.diff) {
    try {
      const diffBuffer = await generateDiffImage(params.diff, params.repoName)
      fileUploads.push({ filename: 'diff.png', file: diffBuffer, title: `${params.repoName} - ${shortSha} コード差分` })
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
    try {
      if (fileUploads.length === 1) {
        await client.filesUploadV2({
          channel_id: params.channelId,
          filename: fileUploads[0].filename,
          file: fileUploads[0].file,
          title: fileUploads[0].title,
          initial_comment: text,
        })
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (client.filesUploadV2 as any)({
          channel_id: params.channelId,
          initial_comment: text,
          file_uploads: fileUploads,
        })
      }
      return
    } catch (err) {
      console.error('file upload failed, falling back to text:', err)
    }
  }

  await client.chat.postMessage({ channel: params.channelId, text })
}
