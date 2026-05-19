export function buildSimplifyMessagePrompt(commitMessage: string): string {
  return `
あなたはエンジニアのコミットメッセージを、プログラミング未経験者でも理解できる日本語に変換する専門家です。

## 指示
以下のコミットメッセージを、専門用語・英語・略語を使わずに1〜2文の平易な日本語で言い換えてください。
「何をした」という事実だけを伝え、技術的な詳細には踏み込まないでください。

## 変換例
- "fix: refactor auth middleware" → "ログイン処理の動作を改善しました"
- "feat: add pagination to user list" → "ユーザー一覧に「次のページ」「前のページ」の機能を追加しました"
- "chore: update dependencies" → "使用しているライブラリのバージョンを最新版に更新しました"
- "fix: resolve null pointer exception in payment service" → "決済処理で発生していたエラーを修正しました"

## コミットメッセージ
${commitMessage}

## 出力形式
変換後のテキストのみを返してください（説明や前置きは不要）。
`.trim();
}
