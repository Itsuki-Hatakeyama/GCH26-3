import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { createClient } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // DBからGitHubトークンを取得
  const { data: integration, error } = await supabase
    .from("github_integrations")
    .select("access_token_encrypted")
    .eq("user_id", session.userId)
    .single();

  if (error || !integration) {
    return NextResponse.json({ error: "GitHub未連携です" }, { status: 404 });
  }

  // トークンを復号化
  const accessToken = decrypt(integration.access_token_encrypted);

  // GitHub APIからリポジトリ一覧を取得
  const res = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "GitHubからの取得に失敗しました" }, { status: 502 });
  }

  const githubRepos = await res.json();

  // すでに連携済みのリポジトリIDを取得
  const { data: connected } = await supabase
    .from("repositories")
    .select("github_repo_id")
    .eq("user_id", session.userId);

  const connectedIds = new Set(connected?.map((r) => r.github_repo_id) ?? []);

  // 必要な情報だけ整形して返す
  const repositories = githubRepos.map((repo: any) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    private: repo.private,
    updated_at: repo.updated_at,
    already_connected: connectedIds.has(String(repo.id)),
  }));

  return NextResponse.json({ repositories });
}