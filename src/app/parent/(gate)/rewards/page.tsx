import { EmptyState } from "@/components/parent/screen-state";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  await requireParent();
  return <EmptyState title="Rewards" body="No reward requests. Yana's balance is on Progress until a prize is added." href="/parent/progress" action="Open progress" />;
}
