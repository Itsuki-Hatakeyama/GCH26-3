-- ============================================================================
-- Clearcode データベース構築用 SQL（シンプル版）
-- ============================================================================
-- 実行環境: Supabase (PostgreSQL 15+)
-- 実行方法: Supabase ダッシュボード → SQL Editor で全文コピペして実行
--
-- 注意:
--   - このファイルは COMMENT 文を削除したシンプル版です
--   - 元のファイル（clearcode-schema.sql）でエラーが出る場合はこちらを使用
-- ============================================================================


-- ============================================================================
-- 0. 拡張機能の有効化
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 1. users テーブル
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);


-- ============================================================================
-- 2. github_integrations テーブル
-- ============================================================================
CREATE TABLE github_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_user_id VARCHAR(255) NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_github_integrations_user_id ON github_integrations(user_id);


-- ============================================================================
-- 3. repositories テーブル
-- ============================================================================
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    description TEXT,
    html_url TEXT NOT NULL,
    default_branch VARCHAR(255) DEFAULT 'main',
    is_private BOOLEAN DEFAULT FALSE,
    last_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, github_repo_id)
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);


-- ============================================================================
-- 4. commits テーブル
-- ============================================================================
CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    sha VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255),
    committed_at TIMESTAMPTZ NOT NULL,
    html_url TEXT NOT NULL,
    diff_url TEXT,
    languages JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repository_id, sha)
);

CREATE INDEX idx_commits_repository_id ON commits(repository_id);
CREATE INDEX idx_commits_committed_at ON commits(committed_at DESC);
CREATE INDEX idx_commits_sha ON commits(sha);
CREATE INDEX idx_commits_languages ON commits USING GIN (languages);


-- ============================================================================
-- 5. branches テーブル
-- ============================================================================
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    parent_branch_name VARCHAR(255),
    last_commit_sha VARCHAR(40),
    is_merged BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

CREATE INDEX idx_branches_repository_id ON branches(repository_id);
CREATE INDEX idx_branches_is_default ON branches(is_default);
CREATE INDEX idx_branches_is_active ON branches(is_active);


-- ============================================================================
-- 6. commit_branches テーブル（中間テーブル）
-- ============================================================================
CREATE TABLE commit_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(commit_id, branch_id)
);

CREATE INDEX idx_commit_branches_commit_id ON commit_branches(commit_id);
CREATE INDEX idx_commit_branches_branch_id ON commit_branches(branch_id);


-- ============================================================================
-- 7. commit_summaries テーブル
-- ============================================================================
CREATE TABLE commit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    simplified_message TEXT NOT NULL,
    code_explanation TEXT NOT NULL,
    frontend_changes TEXT,
    added_technologies JSONB,
    removed_technologies JSONB,
    technology_categories JSONB,
    message_quality_score INTEGER,
    message_quality_feedback TEXT,
    llm_model VARCHAR(50),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(commit_id)
);

CREATE INDEX idx_commit_summaries_commit_id ON commit_summaries(commit_id);
CREATE INDEX idx_commit_summaries_added_tech ON commit_summaries USING GIN (added_technologies);
CREATE INDEX idx_commit_summaries_removed_tech ON commit_summaries USING GIN (removed_technologies);


-- ============================================================================
-- 8. slack_integrations テーブル
-- ============================================================================
CREATE TABLE slack_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    workspace_id VARCHAR(255) NOT NULL,
    workspace_name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(repository_id)
);

CREATE INDEX idx_slack_integrations_repository_id ON slack_integrations(repository_id);


-- ============================================================================
-- 9. notification_logs テーブル
-- ============================================================================
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,
    slack_integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_commit_id ON notification_logs(commit_id);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);


-- ============================================================================
-- 10. updated_at 自動更新トリガー
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_integrations_updated_at
    BEFORE UPDATE ON github_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slack_integrations_updated_at
    BEFORE UPDATE ON slack_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- マイグレーション: commits.changed_files カラム追加
-- ============================================================================
-- 既存DBに追加する場合は以下のSQLをSupabase SQL Editorで実行してください:
--
-- ALTER TABLE commits ADD COLUMN IF NOT EXISTS changed_files JSONB;
-- ============================================================================
-- END OF FILE
-- ============================================================================
