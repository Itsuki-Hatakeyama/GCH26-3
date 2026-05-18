// TODO: supabase gen types で自動生成する予定 - 担当: A

export interface User {
  id: string;
  email: string;
  name: string;
  google_id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: string;
  name: string;
  full_name: string;
  owner: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  is_private: boolean;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commit {
  id: string;
  repository_id: string;
  sha: string;
  message: string;
  author_name: string;
  author_email: string | null;
  committed_at: string;
  html_url: string;
  diff_url: string | null;
  languages: Record<string, unknown> | null;
  created_at: string;
}

export interface CommitSummary {
  id: string;
  commit_id: string;
  simplified_message: string;
  code_explanation: string;
  frontend_changes: string | null;
  added_technologies: unknown[] | null;
  removed_technologies: unknown[] | null;
  technology_categories: Record<string, string[]> | null;
  message_quality_score: number | null;
  message_quality_feedback: string | null;
  llm_model: string | null;
  generated_at: string;
}
