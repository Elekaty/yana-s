import { EmptyState } from "@/components/parent/screen-state";

export const dynamic = "force-dynamic";

export default function RewardsPage() {
  return <EmptyState title="Rewards" body="No reward requests. Yana's balance is on Progress until a prize is added." href="/parent/progress" action="Open progress" />;
}
