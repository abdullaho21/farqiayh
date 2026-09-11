import { VoteWorkspace } from "@/components/vote-workspace";
export default async function PollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VoteWorkspace id={id} />;
}
