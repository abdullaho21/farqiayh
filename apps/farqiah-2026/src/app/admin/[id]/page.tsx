import { AdminWorkspace } from "@/components/admin-workspace";
export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminWorkspace id={id} />;
}
