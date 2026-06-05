import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { supabaseAdmin } from "@/lib/supabase";

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