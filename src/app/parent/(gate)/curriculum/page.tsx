import { EmptyState } from "@/components/parent/screen-state";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function CurriculumPage() {
  await requireParent();
  return <EmptyState title="Curriculum" body="Nothing is listed for this month yet." href="/parent/setup" action="Open setup" />;
}
