-- commit_summaries テーブルに change_categories カラムを追加
-- Supabase ダッシュボード → SQL Editor で実行してください

ALTER TABLE commit_summaries
  ADD COLUMN IF NOT EXISTS change_categories TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_commit_summaries_change_categories
  ON commit_summaries USING GIN (change_categories);
