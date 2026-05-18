import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "GET /api/commits/[id]" },
    { status: 501 }
  );
}
