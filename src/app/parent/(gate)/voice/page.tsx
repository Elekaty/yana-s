import { EmptyState } from "@/components/parent/screen-state";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  await requireParent();
  return <EmptyState title="Voice" body="No recordings yet. They show up when Yana records in Say it." />;
}
