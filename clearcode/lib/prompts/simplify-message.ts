export function buildSimplifyPrompt(message: string): string {
  return `あなたはエンジニアの作業内容を非エンジニアに伝える専門家です。
以下のGitコミットメッセージを、プログラミング知識がない人でも理解できる日本語1〜2文に変換してください。
専門用語は使わず、「何をしたか」を具体的に説明してください。
翻訳文のみを出力し、余分な説明は不要です。

コミットメッセージ: ${message}

翻訳:`
}
