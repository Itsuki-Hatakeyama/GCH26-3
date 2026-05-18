import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // TODO: 後で認証チェックを実装 - 担当: D
  return NextResponse.next();
}

// matcherは今は設定しない（全ページに自由にアクセス可能にする）
