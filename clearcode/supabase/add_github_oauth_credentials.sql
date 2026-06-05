-- usersテーブルに個人のGitHub OAuth資格情報カラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_client_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_client_secret_encrypted TEXT;
