import { EmptyState } from "@/components/parent/screen-state";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  await requireParent();
  return <EmptyState title="Study and prizes" body="The study block and prize rules are still the ones saved in Setup." href="/parent/setup" action="Open setup" />;
}
