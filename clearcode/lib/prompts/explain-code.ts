export function buildExplainCodePrompt(diff: string, message: string): string {
  const diffSnippet = diff.slice(0, 3000)
  return `あなたはエンジニアの作業内容を非エンジニアに伝える専門家です。
以下のコード変更（diff）とコミットメッセージをもとに、プログラミング知識がない人でも理解できる日本語2〜4文の説明を書いてください。
「どのファイルで」「何が変わったか」「それによりユーザーや機能にどんな影響があるか」を含めてください。
説明文のみを出力してください。

コミットメッセージ: ${message}

コード差分:
${diffSnippet}

説明:`
}
