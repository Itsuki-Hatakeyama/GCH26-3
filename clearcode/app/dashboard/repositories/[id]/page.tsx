import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import RepositoryDetailClient from "./RepositoryDetailClient";

export default async function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  const { id } = await params;
  return <RepositoryDetailClient id={id} />;
}
