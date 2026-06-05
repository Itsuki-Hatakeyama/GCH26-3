-- usersテーブルに個人のSlack OAuth資格情報カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_client_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_client_secret_encrypted TEXT;
