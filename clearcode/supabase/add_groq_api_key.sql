-- Supabase SQL Editor で実行してください
ALTER TABLE users ADD COLUMN IF NOT EXISTS groq_api_key_encrypted TEXT;
