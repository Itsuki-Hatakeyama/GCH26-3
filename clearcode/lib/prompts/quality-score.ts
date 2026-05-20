export function buildQualityScorePrompt(message: string): string {
  return `あなたはGitコミットメッセージの品質を評価する専門家です。
以下のコミットメッセージを0〜100点で評価し、JSON形式で返してください。

評価基準:
- 何をしたかが明確か (40点)
- なぜしたかが分かるか (30点)
- 影響範囲が分かるか (30点)

必ずこのJSON形式のみを出力してください:
{"score": <0-100の整数>, "feedback": "<日本語で50文字以内のフィードバック>"}

コミットメッセージ: ${message}`
}
