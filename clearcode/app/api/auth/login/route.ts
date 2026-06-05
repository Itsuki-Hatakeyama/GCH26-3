import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { query } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: { message: "有効なメールアドレスを入力してください" } },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();

    // 既存ユーザーを確認
    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [normalized]
    );

    let userId: string;
    let isNewUser = false;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
    } else {
      // 新規ユーザーを作成
      const name = normalized.split("@")[0];
      const dummyGoogleId = crypto.randomUUID();

      const result = await query<{ id: string }>(
        "INSERT INTO users (email, name, google_id) VALUES ($1, $2, $3) RETURNING id",
        [normalized, name, dummyGoogleId]
      );
      userId = result.rows[0].id;
      isNewUser = true;
    }

    // pending の招待を active に更新
    await query(
      `UPDATE repository_members
       SET user_id = $1, status = 'active', joined_at = NOW()
       WHERE email = $2 AND status = 'pending'`,
      [userId, normalized]
    );

    // JWTセッション発行
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const sessionToken = await new SignJWT({ user_id: userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: { message: "サーバーエラーが発生しました" } },
      { status: 500 }
    );
  }
}
