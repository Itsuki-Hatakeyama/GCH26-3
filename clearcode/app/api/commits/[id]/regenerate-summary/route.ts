import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "POST /api/commits/[id]/regenerate-summary" },
    { status: 501 }
  );
}
