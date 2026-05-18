import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "GET /api/repositories" },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "POST /api/repositories" },
    { status: 501 }
  );
}
