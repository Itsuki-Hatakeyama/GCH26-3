import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(`${origin}/`);
  }

  // ユーザーの保存済み資格情報を優先、なければ環境変数
  let clientId = process.env.GITHUB_CLIENT_ID!
  const result = await query<{ github_client_id: string | null }>(
    'SELECT github_client_id FROM users WHERE id = $1',
    [session.user_id]
  )
  const userClientId = result.rows[0]?.github_client_id
  if (userClientId) clientId = userClientId

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo read:user",
    state: session.user_id,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );
}
