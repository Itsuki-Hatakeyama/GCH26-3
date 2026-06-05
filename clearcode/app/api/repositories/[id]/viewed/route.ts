import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
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

  const { data: repo } = await supabase()
    .from("repositories")
    .select("user_id")
    .eq("id", id)
    .single();

  // オーナーのみ last_viewed_at を更新（メンバーはスキップ）
  if (repo?.user_id === session.user_id) {
    await supabase()
      .from("repositories")
      .update({ last_viewed_at: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
