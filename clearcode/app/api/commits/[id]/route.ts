import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
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

  // repositories を介してユーザーの所有権を確認
  const { data: commit, error } = await supabase()
    .from("commits")
    .select("*, commit_summaries(*), repositories!inner(user_id)")
    .eq("id", id)
    .eq("repositories.user_id", session.user_id)
    .single();

  if (error || !commit) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "コミットが見つかりません" } },
      { status: 404 }
    );
  }

  return NextResponse.json(commit);
}
