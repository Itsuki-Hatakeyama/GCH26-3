-- ============================================================================
-- マイグレーション: repository_members テーブル追加
-- 目的: エンジニアが非エンジニアをリポジトリに招待する仕組み
-- 実行方法: Supabase ダッシュボード → SQL Editor で実行
-- ============================================================================

CREATE TABLE repository_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    UNIQUE(repository_id, email)
);

CREATE INDEX idx_repository_members_repository_id ON repository_members(repository_id);
CREATE INDEX idx_repository_members_user_id ON repository_members(user_id);
CREATE INDEX idx_repository_members_email ON repository_members(email);
CREATE INDEX idx_repository_members_status ON repository_members(status);
