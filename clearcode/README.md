# Clearcode

エンジニアのコミット内容を非エンジニアにも分かる言葉に翻訳するWebアプリ

---

## ローカル起動手順

```bash
# 1. リポジトリをクローン
git clone <リポジトリURL>
cd clearcode          # ← 必ずこのディレクトリに入ってから作業する

# 2. 依存ライブラリをインストール
npm install

# 3. 開発サーバーを起動
npm run dev

# 4. ブラウザでアクセス
# http://localhost:3000
```

## コマンド一覧

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動（ホットリロードあり） |
| `npm run build` | 本番用ビルド |
| `npm run start` | ビルド済みを本番モードで起動 |
| `npm run lint` | ESLint によるコードチェック |

---

## チーム構成と担当

| 担当 | 役割 | 主な担当ファイル |
|---|---|---|
| **A** | バックエンドコア | `lib/services/`, `lib/supabase.ts` |
| **B** | AIプロンプト | `lib/prompts/`, `lib/gemini.ts` |
| **C** | フロントエンド | `app/dashboard/`, `components/` |
| **D** | 外部連携 | `lib/auth.ts`, `lib/github.ts`, `lib/slack.ts`, `middleware.ts` |

---

## ファイル一覧・役割説明

### 設定ファイル

| ファイル | 種別 | 説明 |
|---|---|---|
| `package.json` | 設定 | プロジェクトの依存ライブラリ一覧とnpmコマンド定義。`npm install` はここを参照する |
| `tsconfig.json` | 設定 | TypeScriptのコンパイル設定。`@/*` のパスエイリアスもここで定義 |
| `next.config.ts` | 設定 | Next.jsの動作設定。画像ドメインの許可やリダイレクト設定を書く場所 |
| `tailwind.config.ts` | 設定 | Tailwind CSSのカスタムカラー・アニメーション・対象ファイルの設定。shadcn/ui用のCSS変数も含む |
| `postcss.config.js` | 設定 | TailwindをCSSに変換するためのPostCSS設定 |
| `eslint.config.mjs` | 設定 | コードの書き方ルール（ESLint）の設定 |
| `components.json` | 設定 | shadcn/uiのコンポーネント管理設定。スタイルやエイリアスの定義 |
| `.env.local` | 環境変数 | 実際のAPIキーやDB接続情報を記載。**Gitにコミットしない** |
| `.env.local.example` | 環境変数 | `.env.local` のテンプレート。チームに共有してよいダミーファイル |
| `.gitignore` | 設定 | Gitに含めないファイルの一覧。`.env.local` や `node_modules` などを除外 |
| `next-env.d.ts` | 型定義 | Next.jsが自動生成するTypeScript型定義。手動で編集しない |

---

### app/ — 画面（フロントエンド）

#### ルート共通

| ファイル | 種別 | 説明 |
|---|---|---|
| `app/layout.tsx` | フロント | **全ページ共通のHTMLの外枠**。フォント（Inter）・言語（ja）・メタタグを設定。すべてのページはここでラップされる |
| `app/globals.css` | フロント | **全ページに適用されるCSS**。Tailwindの読み込みと、shadcn/uiが使うCSS変数（色・角丸など）を定義 |
| `app/page.tsx` | フロント | **ランディングページ（`/`）**。サービス説明・機能紹介・ユースケースを表示。セッションCookieが有効なら自動で `/dashboard` へリダイレクト。未ログインならメールアドレス入力フォームを表示 |
| `app/favicon.ico` | 静的ファイル | ブラウザのタブに表示されるアイコン |

#### 認証

| ファイル | 種別 | 説明 |
|---|---|---|
| `app/auth/callback/page.tsx` | フロント | **Google OAuthのコールバック画面**（将来用）。ローディングスピナーとエラー表示を持つClient Component。現在はメール認証方式のため未使用 |

#### ダッシュボード

| ファイル | 種別 | 説明 |
|---|---|---|
| `app/dashboard/layout.tsx` | フロント | **ダッシュボード全ページ共通のレイアウト**。上部ナビゲーションバー（ロゴ・リポジトリ追加・設定リンク）を表示 |
| `app/dashboard/page.tsx` | フロント | **ダッシュボードのホーム画面（`/dashboard`）**。連携済みリポジトリの一覧を表示予定。現在は空状態のUIのみ実装 |
| `app/dashboard/connect-github/page.tsx` | フロント | **GitHub連携画面**。GitHubアカウントと接続してリポジトリを選ぶ画面（実装予定・担当D） |
| `app/dashboard/settings/page.tsx` | フロント | **設定画面**。通知設定・アカウント設定など（実装予定・担当C） |
| `app/dashboard/repositories/[id]/page.tsx` | フロント | **リポジトリ詳細画面**。特定リポジトリのコミット一覧を表示予定。`[id]` はリポジトリのUUID（実装予定・担当C） |
| `app/dashboard/repositories/[id]/slack/page.tsx` | フロント | **Slack連携画面**。そのリポジトリの通知を送るSlackチャンネルを設定（実装予定・担当D） |
| `app/dashboard/repositories/[id]/commits/[sha]/page.tsx` | フロント | **コミット詳細画面**。1件のコミットの翻訳結果・コード説明・品質スコアを表示（実装予定・担当C） |

---

### app/api/ — APIルート（バックエンド）

#### 認証系

| ファイル | HTTPメソッド | 実装状況 | 説明 |
|---|---|---|---|
| `app/api/auth/login/route.ts` | POST | **実装済み** | **メール認証のメイン処理**。メールアドレスを受け取り、Supabaseの `users` テーブルを検索。未登録なら自動作成、登録済みならそのままログイン。JWTを生成してCookieにセット |
| `app/api/auth/me/route.ts` | GET | **実装済み** | **ログイン中のユーザー確認**。CookieのJWTを検証して `user_id` を返す。未ログインなら401を返す |
| `app/api/auth/logout/route.ts` | POST | 未実装（501） | ログアウト処理。Cookieのセッションを削除する（実装予定・担当D） |
| `app/api/auth/google/start/route.ts` | GET | 実装済み（将来用） | Google OAuthの開始。Google認可画面へリダイレクト（現在は未使用） |
| `app/api/auth/google/callback/route.ts` | POST | 実装済み（将来用） | Google OAuthのコールバック。認可コード→トークン→ユーザー情報取得→DB保存（現在は未使用） |
| `app/api/auth/github/start/route.ts` | GET | 未実装（501） | GitHub OAuth開始（実装予定・担当D） |
| `app/api/auth/github/callback/route.ts` | GET | 未実装（501） | GitHub OAuthコールバック（実装予定・担当D） |
| `app/api/auth/slack/start/route.ts` | GET | 未実装（501） | Slack OAuth開始（実装予定・担当D） |
| `app/api/auth/slack/callback/route.ts` | GET | 未実装（501） | Slack OAuthコールバック（実装予定・担当D） |

#### リポジトリ系

| ファイル | HTTPメソッド | 説明 |
|---|---|---|
| `app/api/repositories/route.ts` | GET / POST | リポジトリ一覧取得 / 新規リポジトリ登録（実装予定・担当A） |
| `app/api/repositories/[id]/route.ts` | GET / DELETE | 特定リポジトリの取得 / 削除（実装予定・担当A） |
| `app/api/repositories/[id]/viewed/route.ts` | PATCH | リポジトリの「最終閲覧日時」を更新（実装予定・担当A） |
| `app/api/repositories/[id]/commits/route.ts` | GET | そのリポジトリのコミット一覧取得（実装予定・担当A） |
| `app/api/repositories/[id]/slack/route.ts` | PUT / DELETE | Slack連携設定の登録 / 解除（実装予定・担当D） |

#### コミット系

| ファイル | HTTPメソッド | 説明 |
|---|---|---|
| `app/api/commits/[id]/route.ts` | GET | 特定コミットの詳細（翻訳結果・コード説明）取得（実装予定・担当A） |
| `app/api/commits/[id]/regenerate-summary/route.ts` | POST | AIによるコミット要約を再生成（実装予定・担当B） |

#### 外部サービス系

| ファイル | HTTPメソッド | 説明 |
|---|---|---|
| `app/api/github/repositories/route.ts` | GET | GitHubから連携可能なリポジトリ一覧を取得（実装予定・担当D） |
| `app/api/slack/channels/route.ts` | GET | Slackのチャンネル一覧を取得（実装予定・担当D） |
| `app/api/webhooks/github/route.ts` | POST | **GitHubからのWebhook受信口**。pushイベントを受け取りコミット処理を開始（実装予定・担当A） |

---

### components/ — UIコンポーネント

#### カスタムコンポーネント

| ファイル | 種別 | 説明 |
|---|---|---|
| `components/LoginForm.tsx` | フロント（Client） | **メールアドレス入力フォーム**。入力値をPOSTして `/api/auth/login` を呼び出し、結果に応じてダッシュボードへリダイレクト。ローディング・エラー表示あり |
| `components/Header.tsx` | フロント | 共通ヘッダーコンポーネント（現在は各ページのlayoutに直書きのため未使用・実装予定） |
| `components/RepositoryCard.tsx` | フロント | リポジトリ一覧で1件分のカード表示（実装予定・担当C） |
| `components/CommitCard.tsx` | フロント | コミット一覧で1件分のカード表示（実装予定・担当C） |
| `components/TechBadge.tsx` | フロント | 使用技術を示すバッジ表示（例: React, TypeScript）（実装予定・担当C） |
| `components/QualityScore.tsx` | フロント | コミットメッセージの品質スコアをビジュアル表示（実装予定・担当C） |

#### components/ui/ — shadcn/ui（自動生成・編集不要）

| ファイル | 説明 |
|---|---|
| `components/ui/button.tsx` | ボタンコンポーネント。variant（default/outline/ghost）とsize（sm/lg）で見た目を切り替え |
| `components/ui/card.tsx` | カードコンポーネント。`Card`, `CardHeader`, `CardContent`, `CardFooter` などの組み合わせで使う |
| `components/ui/input.tsx` | テキスト入力フォームのコンポーネント |
| `components/ui/badge.tsx` | 小さいラベル表示（タグ・ステータス表示に使う） |
| `components/ui/avatar.tsx` | ユーザーアイコン表示。画像があれば表示、なければイニシャルを表示 |
| `components/ui/dialog.tsx` | モーダルダイアログ。確認画面や入力フォームのポップアップに使う |
| `components/ui/dropdown-menu.tsx` | ドロップダウンメニュー。右クリックメニューや選択肢リストに使う |

---

### lib/ — ビジネスロジック・外部接続

#### 実装済み

| ファイル | 種別 | 説明 |
|---|---|---|
| `lib/auth.ts` | バックエンド | **セッション認証のユーティリティ**。CookieからJWTを読み取り、`SESSION_SECRET` で検証して `user_id` を返す `getSession()` 関数を提供。ページのアクセス制御に使う |
| `lib/db.ts` | DB接続 | **PostgreSQL（Supabase）への直接接続**。`DATABASE_URL` を使いコネクションプールを管理。`query(sql, params)` 関数でSQLを実行できる |
| `lib/utils.ts` | ユーティリティ | Tailwindのクラス名を結合する `cn()` 関数。shadcn/uiが内部で使用 |

#### 未実装（担当者が実装）

| ファイル | 担当 | 実装予定の内容 |
|---|---|---|
| `lib/supabase.ts` | A | Supabase JS クライアントの初期化（現在は `db.ts` の直接接続で代替中） |
| `lib/github.ts` | D | GitHub API クライアント。Octokit を使ったリポジトリ・コミット取得 |
| `lib/gemini.ts` | B | Gemini API クライアント。AIへのリクエスト送信処理 |
| `lib/slack.ts` | D | Slack API クライアント。チャンネル取得・メッセージ送信 |
| `lib/crypto.ts` | D | 暗号化ユーティリティ。GitHubトークンやSlackトークンを安全にDB保存するための暗号化・復号化 |

#### lib/services/ — サービス層（未実装）

| ファイル | 担当 | 実装予定の内容 |
|---|---|---|
| `lib/services/commit-service.ts` | A | コミットのDB保存・取得。Webhookで受け取ったデータを整形してDBに入れる |
| `lib/services/summary-service.ts` | A | AI要約の保存・取得。Geminiの結果を `commit_summaries` テーブルに保存 |
| `lib/services/repository-service.ts` | A | リポジトリのDB操作。登録・削除・一覧取得など |
| `lib/services/notification-service.ts` | D | Slack通知の送信処理。コミット要約をSlackに投稿する |

#### lib/prompts/ — AIプロンプト（未実装）

| ファイル | 担当 | 実装予定の内容 |
|---|---|---|
| `lib/prompts/simplify-message.ts` | B | コミットメッセージを平易な日本語に変換するプロンプト |
| `lib/prompts/explain-code.ts` | B | コードの差分を自然言語で説明するプロンプト |
| `lib/prompts/quality-score.ts` | B | コミットメッセージの品質スコアを0〜100で評価するプロンプト |

---

### types/ — 型定義

| ファイル | 説明 |
|---|---|
| `types/database.ts` | Supabaseのテーブル構造に対応するTypeScript型。`User`, `Repository`, `Commit`, `CommitSummary` など |
| `types/api.ts` | APIレスポンスの型定義（実装予定・担当A） |

---

### supabase/ — データベース

| ファイル | 説明 |
|---|---|
| `supabase/schema.sql` | **Supabaseで実行するDB構築SQL**。テーブル作成・インデックス・トリガーをすべて含む。Supabase ダッシュボードの SQL Editor で一度だけ実行する |

---

### ルートの設定ファイル

| ファイル | 説明 |
|---|---|
| `middleware.ts` | **全リクエストに割り込む処理**。現在は何もせず通過させるだけ。将来ここで未ログインユーザーを `/` にリダイレクトする認証チェックを実装（担当D） |

---

### public/ — 静的ファイル

| ファイル | 説明 |
|---|---|
| `public/next.svg` など | Next.jsのデフォルト画像。現在は未使用。ロゴ画像などに差し替え予定 |

---

## 動作確認URL

| URL | 期待される結果 |
|---|---|
| http://localhost:3000 | ランディングページ（ログイン済みなら自動でダッシュボードへ） |
| http://localhost:3000/dashboard | ホーム画面 |
| http://localhost:3000/dashboard/connect-github | GitHub連携ページ |
| http://localhost:3000/dashboard/settings | 設定ページ |
| http://localhost:3000/dashboard/repositories/test-id | リポジトリ詳細 |
| http://localhost:3000/dashboard/repositories/test-id/slack | Slack連携 |
| http://localhost:3000/dashboard/repositories/test-id/commits/test-sha | コミット詳細 |
| http://localhost:3000/api/auth/me | ログイン中: `{"user_id":"..."}` / 未ログイン: 401 |
