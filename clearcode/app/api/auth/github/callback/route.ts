import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { createClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect-github?error=no_code`
    );
  }

  // GitHubにcodeを送ってアクセストークンを取得
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect-github?error=token_failed`
    );
  }

  // GitHubユーザー情報を取得
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userRes.json();

  // トークンを暗号化してDBに保存
  const encryptedToken = encrypt(tokenData.access_token);
  const supabase = createClient();

  const { error } = await supabase.from("github_integrations").upsert({
    user_id: session.userId,
    github_user_id: String(githubUser.id),
    github_username: githubUser.login,
    access_token_encrypted: encryptedToken,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("DB error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect-github?error=db_failed`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect-github?github=connected`
  );
}