import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";
import { generateSummary } from "@/lib/services/summary-service";

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
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

  // ユーザーのリポジトリに属するコミットのみ許可
  const { data: commit, error } = await supabase()
    .from("commits")
    .select("id, sha, message, repositories!inner(user_id)")
    .eq("id", id)
    .eq("repositories.user_id", session.user_id)
    .single();

  if (error || !commit) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "コミットが見つかりません" } },
      { status: 404 }
    );
  }

  // diff は crypto.ts / github.ts 実装後に追加予定（担当: D）
  // 現時点はコミットメッセージのみで生成
  const result = await generateSummary(commit.message, "");

  if (!result) {
    return NextResponse.json(
      { error: { code: "UNKNOWN", message: "要約の生成に失敗しました" } },
      { status: 500 }
    );
  }

  if ("error" in result) {
    const messages: Record<string, string> = {
      QUOTA_EXCEEDED: "Geminiの1日の利用上限に達しました。明日再度お試しください",
      AUTH_ERROR: "Gemini APIキーが無効です。.env.local の GEMINI_API_KEY を確認してください",
      UNKNOWN: "要約の生成に失敗しました",
    };
    return NextResponse.json(
      { error: { code: result.error, message: messages[result.error] } },
      { status: result.error === "QUOTA_EXCEEDED" ? 503 : 500 }
    );
  }

  const { error: upsertError } = await supabase()
    .from("commit_summaries")
    .upsert({ commit_id: id, ...result }, { onConflict: "commit_id" });

  if (upsertError) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: "保存に失敗しました" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
