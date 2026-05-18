import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "認可コードが必要です" } },
        { status: 400 }
      );
    }

    // Googleからアクセストークン取得
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: { code: "TOKEN_EXCHANGE_FAILED", message: "認証に失敗しました。もう一度お試しください" } },
        { status: 401 }
      );
    }

    const tokens = await tokenRes.json();

    // Googleからユーザー情報取得
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: { code: "USER_INFO_FAILED", message: "ユーザー情報の取得に失敗しました" } },
        { status: 500 }
      );
    }

    const googleUser = await userRes.json();

    // 既存ユーザー確認
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("google_id", googleUser.id)
      .single();

    const isNewUser = !existingUser;

    // usersテーブルにUPSERT
    const { data: user, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          google_id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatar_url: googleUser.picture,
        },
        { onConflict: "google_id" }
      )
      .select()
      .single();

    if (upsertError || !user) {
      console.error("Upsert error:", upsertError);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: "ユーザー情報の保存に失敗しました" } },
        { status: 500 }
      );
    }

    // JWTセッショントークン生成
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const sessionToken = await new SignJWT({ user_id: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // HttpOnly CookieにセッションをセッT
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ ok: true, isNewUser });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
