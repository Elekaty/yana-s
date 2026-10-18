import { EmptyState } from "@/components/parent/screen-state";

export const dynamic = "force-dynamic";

export default function StudyPage() {
  return <EmptyState title="Study and prizes" body="The study block and prize rules are still the ones saved in Setup." href="/parent/setup" action="Open setup" />;
}
