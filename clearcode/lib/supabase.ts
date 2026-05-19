// TODO: Supabaseクライアントの初期化を後で実装
// 担当: A
import { createClient as supabaseCreateClient } from "@supabase/supabase-js";

export function createClient() {
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
