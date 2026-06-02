export type ChangeCategory =
  | "フロントエンド"
  | "バックエンド"
  | "インフラ"
  | "テスト"
  | "ドキュメント"
  | "設定"
  | "リファクタリング"
  | "バグ修正";

export function buildCategorizePrompt(commitMessage: string, diff: string): string {
  const diffSnippet = diff.slice(0, 3000);
  return `あなたはコードレビュー専門家です。以下のGitコミットを分析し、変更カテゴリを判定してください。

## カテゴリ定義
- フロントエンド: UIコンポーネント、スタイル、ページ、画面表示に関する変更
- バックエンド: APIルート、サーバーロジック、データベース処理、認証に関する変更
- インフラ: CI/CD、Docker、デプロイ設定、サーバー構成に関する変更
- テスト: テストコードの追加・修正
- ドキュメント: README、コメント、ドキュメント類の変更
- 設定: package.json、tsconfig、環境変数、各種設定ファイルの変更
- リファクタリング: 動作を変えずにコードを整理・改善する変更
- バグ修正: 不具合の修正

## 入力
コミットメッセージ: ${commitMessage}

コード差分:
${diffSnippet || "(差分なし)"}

## 出力形式
当てはまるカテゴリを配列で返してください（複数可、最大3つ）。
必ず以下のJSONのみを出力してください。余分なテキストは不要です。

{"categories": ["カテゴリ1", "カテゴリ2"]}`;
}
