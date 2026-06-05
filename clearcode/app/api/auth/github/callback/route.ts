import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(`${origin}/`);
  }

  const githubError = request.nextUrl.searchParams.get("error")
  if (githubError) {
    return NextResponse.redirect(
      `${origin}/dashboard/connect-github?error=${encodeURIComponent(githubError)}`
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${origin}/dashboard/connect-github?error=no_code`
    );
  }

  // state に user_id が入っている場合、そのユーザーの資格情報を使用
  const stateUserId = request.nextUrl.searchParams.get("state") ?? session.user_id
  let clientId = process.env.GITHUB_CLIENT_ID!
  let clientSecret = process.env.GITHUB_CLIENT_SECRET!

  const credResult = await query<{
    github_client_id: string | null
    github_client_secret_encrypted: string | null
  }>(
    'SELECT github_client_id, github_client_secret_encrypted FROM users WHERE id = $1',
    [stateUserId]
  )
  const row = credResult.rows[0]
  if (row?.github_client_id && row?.github_client_secret_encrypted) {
    clientId = row.github_client_id
    clientSecret = await decrypt(row.github_client_secret_encrypted)
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      `${origin}/dashboard/connect-github?error=token_failed`
    );
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userRes.json();

  const encryptedToken = await encrypt(tokenData.access_token);

  const { error } = await supabaseAdmin.from("github_integrations").upsert({
    user_id: session.user_id,
    github_user_id: String(githubUser.id),
    github_username: githubUser.login,
    access_token_encrypted: encryptedToken,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.redirect(
      `${origin}/dashboard/connect-github?error=db_failed`
    );
  }

  return NextResponse.redirect(
    `${origin}/dashboard/connect-github?github=connected`
  );
}
