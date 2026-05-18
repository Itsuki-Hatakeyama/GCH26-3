import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { message: "Not implemented yet", endpoint: "PATCH /api/repositories/[id]/viewed" },
    { status: 501 }
  );
}
