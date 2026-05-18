import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "POST /api/webhooks/github" },
    { status: 501 }
  );
}
