import { postMessage } from '@/lib/slack'
import { decrypt } from '@/lib/crypto'

interface NotifyParams {
  accessTokenEncrypted: string
  channelId: string
  repoName: string
  commitSha: string
  authorName: string
  simplifiedMessage: string
  codeExplanation: string
  commitUrl: string
}

export async function sendCommitNotification(params: NotifyParams): Promise<void> {
  const token = await decrypt(params.accessTokenEncrypted)

  const shortSha = params.commitSha.slice(0, 7)
  const text = `📦 *${params.repoName}* に新しい変更が届きました\n\n*${params.simplifiedMessage}*\n\n${params.codeExplanation}\n\n👤 ${params.authorName} | <${params.commitUrl}|コミット ${shortSha}を見る>`

  await postMessage(token, params.channelId, text)
}
