import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "GET /api/repositories/[id]" },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "DELETE /api/repositories/[id]" },
    { status: 501 }
  );
}
