import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import CommitDetailClient from "./CommitDetailClient";

export default async function CommitDetailPage({
  params,
}: {
  params: Promise<{ id: string; sha: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id, sha } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: repo } = await supabase
    .from("repositories")
    .select("name")
    .eq("id", id)
    .eq("user_id", session.user_id)
    .single();

  return (
    <CommitDetailClient
      repositoryId={id}
      sha={sha}
      repositoryName={repo?.name ?? "リポジトリ"}
    />
  );
}
