# Clearcode

エンジニアのコミット内容を非エンジニアにも分かる言葉に翻訳するWebアプリ

## セットアップ手順

1. リポジトリをclone
2. 依存ライブラリインストール: `npm install`
3. `.env.local.example` を `.env.local` にコピー（中身は後で各担当が埋める）
4. 開発サーバー起動: `npm run dev`
5. ブラウザで http://localhost:3000 にアクセス

## チーム構成と担当

- **A**: バックエンドコア（Webhook受信、コミット処理、要約処理の統合）
- **B**: AIプロンプト（Gemini API、プロンプト設計）
- **C**: フロントエンド（画面、UIコンポーネント）
- **D**: 外部連携（OAuth、Slack、認証・セッション、暗号化）

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
├── lib/                                # 外部サービス連携（全て空）
├── components/                         # UIコンポーネント
├── types/                              # 型定義
└── middleware.ts                       # 認証ミドルウェア（未実装）
```

## 動作確認

以下のURLにアクセスして全画面が表示されることを確認してください:

- http://localhost:3000 （ランディング）
- http://localhost:3000/dashboard （ホーム）
- http://localhost:3000/dashboard/connect-github
- http://localhost:3000/dashboard/settings
- http://localhost:3000/dashboard/repositories/test-id
- http://localhost:3000/dashboard/repositories/test-id/slack
- http://localhost:3000/dashboard/repositories/test-id/commits/test-sha
- http://localhost:3000/api/auth/me （501 JSONが返る）
