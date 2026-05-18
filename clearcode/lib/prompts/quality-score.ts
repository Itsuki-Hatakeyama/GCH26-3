export interface QualityScoreOutput {
  score: number;
  feedback: string;
  suggestion: string;
}

export function buildQualityScorePrompt(commitMessage: string): string {
  return `
あなたはコミットメッセージの品質を評価する専門家です。

## 指示
以下のコミットメッセージを0〜100点で評価し、フィードバックを日本語で提供してください。

## 評価基準（合計100点）
- 何をしたかが明確か（30点）
- なぜしたか・背景が分かるか（20点）
- 影響範囲（ファイル・機能）が分かるか（20点）
- 適切な接頭辞（feat/fix/chore/docs等）があるか（15点）
- 簡潔かつ具体的か（15点）

## コミットメッセージ
${commitMessage}

## 出力形式（JSONのみ、他の文字は一切不要）
{
  "score": <0〜100の整数>,
  "feedback": "<評価のフィードバック（1〜2文の日本語）>",
  "suggestion": "<スコアが60未満の場合のみ、より良いコミットメッセージの例。不要なら空文字>"
}
`.trim();
}
