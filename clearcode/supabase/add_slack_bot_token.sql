-- usersテーブルに個人のSlack Bot Tokenカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_bot_token_encrypted TEXT;
