import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "PUT /api/repositories/[id]/slack" },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "DELETE /api/repositories/[id]/slack" },
    { status: 501 }
  );
}
