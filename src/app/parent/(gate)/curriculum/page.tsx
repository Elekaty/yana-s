import { EmptyState } from "@/components/parent/screen-state";

export const dynamic = "force-dynamic";

export default function CurriculumPage() {
  return <EmptyState title="Curriculum" body="Nothing is listed for this month yet." href="/parent/setup" action="Open setup" />;
}
