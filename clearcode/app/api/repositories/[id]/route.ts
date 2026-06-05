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

  const { data: repository, error } = await supabase()
    .from("repositories")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !repository) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "リポジトリが見つかりません" } },
      { status: 404 }
    );
  }

  const isOwner = repository.user_id === session.user_id;

  if (!isOwner) {
    const { data: membership } = await supabase()
      .from("repository_members")
      .select("id")
      .eq("repository_id", id)
      .eq("user_id", session.user_id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "リポジトリが見つかりません" } },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ ...repository, is_owner: isOwner });
}

export async function DELETE(
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

  const { error, count } = await supabase()
    .from("repositories")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", session.user_id);

  if (error) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "削除に失敗しました" } },
      { status: 500 }
    );
  }

  if (!count || count === 0) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "削除する権限がありません" } },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
