import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

const PAGE_SIZE = 10;

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ログインが必要です" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  // 所有権確認 + last_viewed_at 取得
  const { data: repo, error: repoError } = await supabase()
    .from("repositories")
    .select("id, last_viewed_at")
    .eq("id", id)
    .eq("user_id", session.user_id)
    .single();

  if (repoError || !repo) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "リポジトリが見つかりません" } },
      { status: 404 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const sha = sp.get("sha");

  // sha 指定時は単一コミットを返す
  if (sha) {
    const { data: commit, error } = await supabase()
      .from("commits")
      .select("*, commit_summaries(*)")
      .eq("repository_id", id)
      .eq("sha", sha)
      .single();

    if (error || !commit) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "コミットが見つかりません" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ commit });
  }

  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const unreadOnly = sp.get("unread_only") === "true";
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase()
    .from("commits")
    .select("*, commit_summaries(*)", { count: "exact" })
    .eq("repository_id", id)
    .order("committed_at", { ascending: false });

  if (unreadOnly && repo.last_viewed_at) {
    query = query.gt("committed_at", repo.last_viewed_at);
  } else if (!unreadOnly) {
    query = query.range(offset, offset + PAGE_SIZE - 1);
  }

  const { data: commits, error: commitsError, count } = await query;

  if (commitsError) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "コミットの取得に失敗しました" } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    commits: commits ?? [],
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    },
    lastViewedAt: repo.last_viewed_at,
  });
}
