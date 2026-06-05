# Slack 連携ドキュメント

## 概要

Clearcode では、コミット内容を Slack チャンネルに通知する機能を提供しています。  
連携方式は **OAuth 方式** と **Bot Token 方式** の2種類から選択できます。

---

## 連携方式の比較

| 項目 | OAuth 方式 | Bot Token 方式 |
|------|-----------|---------------|
| 対象 | 複数ワークスペース対応 | 単一ワークスペース |
| 設定難易度 | やや複雑 | シンプル |
| 必要な環境変数 | `SLACK_CLIENT_ID` `SLACK_CLIENT_SECRET` `SLACK_REDIRECT_URI` | `SLACK_BOT_TOKEN` |
| ユーザー操作 | Slack 認可画面でワークスペースを選択 | チャンネルを選ぶだけ |
| トークン保存先 | DB（暗号化して保存） | DB に保存しない（env から参照） |

---

## 方式 1: OAuth 方式

### 必要な環境変数

```env
SLACK_CLIENT_ID=xxxxxxxxxxxx.xxxxxxxxxxxx
SLACK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SLACK_REDIRECT_URI=https://your-domain.com/api/auth/slack/callback
```

### Slack App 設定

1. [api.slack.com/apps](https://api.slack.com/apps) でアプリを作成
2. **OAuth & Permissions** で以下の Bot Token Scopes を追加:
   - `chat:write` — メッセージ送信
   - `channels:read` — チャンネル一覧取得
   - `files:write` — 差分画像アップロード
3. **Redirect URLs** に `SLACK_REDIRECT_URI` の値を登録

### 認証フロー

```
ユーザー
  → [Slackと連携する（OAuth）] ボタンをクリック
  → GET /api/auth/slack/start?repository_id={id}
  → Slack 認可画面 (https://slack.com/oauth/v2/authorize)
      scope: chat:write,channels:read,files:write
      state: repository_id
  → ユーザーがワークスペースを選択・承認
  → GET /api/auth/slack/callback?code=xxx&state={repository_id}
      ├─ Slack API でアクセストークンを取得
      ├─ トークンを暗号化して slack_integrations テーブルに保存
      └─ /dashboard/repositories/{id}/slack?connected=1 にリダイレクト
  → チャンネル選択画面で通知先を選択
  → PUT /api/repositories/{id}/slack  { channel_id, channel_name, method: "oauth" }
```

### DB 保存内容 (`slack_integrations` テーブル)

| カラム | 値 |
|--------|-----|
| `workspace_id` | Slack チーム ID |
| `workspace_name` | Slack ワークスペース名 |
| `channel_id` | 選択したチャンネル ID |
| `channel_name` | `#channel-name` 形式 |
| `access_token_encrypted` | 暗号化されたアクセストークン |
| `is_active` | `true` |

---

## 方式 2: Bot Token 方式

### 必要な環境変数

```env
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Slack App 設定

1. [api.slack.com/apps](https://api.slack.com/apps) でアプリを作成
2. **OAuth & Permissions** で以下の Bot Token Scopes を追加:
   - `chat:write`
   - `channels:read`
   - `files:write`
3. アプリをワークスペースにインストールし、Bot Token (`xoxb-...`) を取得
4. 通知先チャンネルにボットを招待: `/invite @your-app-name`

### 設定フロー

```
ユーザー
  → プロフィール画面で「Bot Token方式」を選択（localStorage に保存）
  → リポジトリの Slack 連携ページで [チャンネルを選択する] をクリック
  → GET /api/slack/channels  (repository_id なし)
      └─ 環境変数 SLACK_BOT_TOKEN でチャンネル一覧を取得
  → チャンネルを選択
  → PUT /api/repositories/{id}/slack  { channel_id, channel_name, method: "bottoken" }
```

### DB 保存内容 (`slack_integrations` テーブル)

| カラム | 値 |
|--------|-----|
| `workspace_id` | `"bottoken"` （固定値） |
| `workspace_name` | `"Bot Token"` （固定値） |
| `channel_id` | 選択したチャンネル ID |
| `channel_name` | `#channel-name` 形式 |
| `access_token_encrypted` | `""` （空文字）|
| `is_active` | `true` |

> 通知送信時、`access_token_encrypted` が空の場合は自動的に `SLACK_BOT_TOKEN` 環境変数を使用します。

---

## チャンネル取得の仕様

- プライベートチャンネル (`is_private: true`) は除外
- アーカイブ済みチャンネル (`is_archived: true`) は除外
- ページネーション対応（`conversations.list` API を cursor で全件取得）

---

## Slack 通知の内容

コミット詳細ページから「Slack に通知する」を実行すると、以下の形式でメッセージが送信されます。

```
📦 *{リポジトリ名}* に新しい変更が届きました

*{簡易メッセージ}*

🙋 *非エンジニア向け*
{非エンジニア向け説明}

🛠 *エンジニア向け*
{エンジニア向け技術説明}

📖 *専門用語*
• *{用語}*: {説明}
• *{用語}*: {説明}

👤 {作者名}  |  コミット `{短縮SHA}`
```

### 添付ファイル

差分がある場合、コードの変更内容を画像化して添付します（`filesUploadV2` API 使用）。

| ファイル | 内容 |
|--------|------|
| `{filename}.png` | 差分画像（ファイルごとに1枚） |
| `before.png` | 変更前スクリーンショット（ある場合） |
| `after.png` | 変更後スクリーンショット（ある場合） |

最初の画像に本文テキストが `initial_comment` として付与されます。  
画像がない場合は `chat.postMessage` でテキストのみ送信されます。

---

## API エンドポイント一覧

| メソッド | パス | 説明 |
|--------|------|------|
| `GET` | `/api/auth/slack/start?repository_id={id}` | OAuth 認可開始 |
| `GET` | `/api/auth/slack/callback` | OAuth コールバック処理 |
| `GET` | `/api/repositories/{id}/slack` | Slack 連携状態の取得 |
| `PUT` | `/api/repositories/{id}/slack` | チャンネル設定の保存 |
| `DELETE` | `/api/repositories/{id}/slack` | Slack 連携の解除 |
| `GET` | `/api/slack/channels?repository_id={id}` | チャンネル一覧取得（OAuth） |
| `GET` | `/api/slack/channels` | チャンネル一覧取得（Bot Token） |

---

## 連携解除

リポジトリの Slack 連携ページ下部の「連携を解除する」をクリックすると、`slack_integrations` テーブルのレコードが削除されます（`DELETE /api/repositories/{id}/slack`）。

---

## トラブルシューティング

### OAuth 連携に失敗する
- `SLACK_REDIRECT_URI` が Slack App の Redirect URLs に登録されているか確認
- `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` が正しく設定されているか確認
- Bot Token Scopes に `chat:write`, `channels:read`, `files:write` が追加されているか確認

### Bot Token 方式でチャンネルが表示されない
- `SLACK_BOT_TOKEN` 環境変数が設定されているか確認（`xoxb-` で始まるトークン）
- ボットがワークスペースにインストールされているか確認
- チャンネルにボットが招待されているか確認（`/invite @app-name`）

### メッセージが送信されない
- 通知先チャンネルにボットが参加しているか確認
- Bot Token Scopes に `chat:write` が含まれているか確認
- プライベートチャンネルへの通知には `chat:write` に加えてボットの招待が必要
