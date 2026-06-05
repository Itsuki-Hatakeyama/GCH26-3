-- Supabase SQL Editor で実行してください
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_api_key_encrypted TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'groq';
