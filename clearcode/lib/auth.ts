import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export interface SessionPayload {
  user_id: string;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.user_id || typeof payload.user_id !== "string") return null;

    return { user_id: payload.user_id };
  } catch {
    return null;
  }
}
