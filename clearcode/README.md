# Clearcode

エンジニアのコミット内容を非エンジニアにも分かる言葉に翻訳するWebアプリ

## ローカル起動手順

### 1. リポジトリをクローン

```bash
git clone <リポジトリURL>
cd clearcode   # ← このディレクトリに入ってから作業してください
```

### 2. 依存ライブラリをインストール

```bash
npm install
```

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、各自の担当箇所のキーを埋めてください。  
**現時点では空のままでも起動できます。**

### 4. 開発サーバーを起動

```bash
npm run dev
```

### 5. ブラウザでアクセス

```
http://localhost:3000
```

---

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

## ディレクトリ構成

```
clearcode/
├── app/
│   ├── page.tsx                        # ランディング
│   ├── layout.tsx                      # ルートレイアウト
│   ├── globals.css
│   ├── auth/callback/page.tsx          # OAuthコールバック
│   ├── dashboard/
│   │   ├── layout.tsx                  # ダッシュボード共通レイアウト
│   │   ├── page.tsx                    # ホーム
│   │   ├── connect-github/page.tsx     # GitHub連携
│   │   ├── settings/page.tsx           # 設定
│   │   └── repositories/[id]/
│   │       ├── page.tsx                # リポジトリ詳細
│   │       ├── slack/page.tsx          # Slack連携
│   │       └── commits/[sha]/page.tsx  # コミット詳細
│   └── api/                            # APIルート（全て501を返す）
├── lib/                                # 外部サービス連携（全て空・要実装）
├── components/                         # UIコンポーネント
├── types/                              # 型定義
├── supabase/
│   └── schema.sql                      # DB構築用SQL
└── middleware.ts                       # 認証ミドルウェア（未実装）
```

---

## 動作確認

起動後、以下のURLが全て表示されることを確認してください:

| URL | 期待される結果 |
|---|---|
| http://localhost:3000 | ランディングページ |
| http://localhost:3000/dashboard | ホーム画面 |
| http://localhost:3000/dashboard/connect-github | GitHub連携ページ |
| http://localhost:3000/dashboard/settings | 設定ページ |
| http://localhost:3000/dashboard/repositories/test-id | リポジトリ詳細 |
| http://localhost:3000/dashboard/repositories/test-id/slack | Slack連携 |
| http://localhost:3000/dashboard/repositories/test-id/commits/test-sha | コミット詳細 |
| http://localhost:3000/api/auth/me | `{"message":"Not implemented yet"}` (501) |
