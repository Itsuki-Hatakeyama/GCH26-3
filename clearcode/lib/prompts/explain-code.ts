const MAX_DIFF_CHARS = 8000;

export function buildExplainCodePrompt(commitMessage: string, diff: string): string {
  const truncatedDiff =
    diff.length > MAX_DIFF_CHARS
      ? diff.slice(0, MAX_DIFF_CHARS) + "\n... (長すぎるため省略)"
      : diff;

  return `
あなたはエンジニアのコード変更内容を、プログラミング未経験者に分かりやすく説明する専門家です。

## 指示
以下のコミットメッセージとコード差分（diff）をもとに、このコミットで「何が変わったか」を日本語で説明してください。

## ルール
- 専門用語・英語の変数名は使わないか、使う場合は日本語で補足する
- 変更の「機能・動作」の変化にフォーカスし、コードの詳細には踏み込まない
- 3〜5文程度にまとめる

## コミットメッセージ
${commitMessage}

## コード差分
\`\`\`
${truncatedDiff}
\`\`\`

## 出力形式
説明文のみを返してください（「以下が説明です」などの前置きは不要）。
`.trim();
}
