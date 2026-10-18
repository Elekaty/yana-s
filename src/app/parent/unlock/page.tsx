import { UnlockForm } from "@/app/parent/unlock/unlock-form";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const { family } = await requireParent();
  return <UnlockForm hasPin={family.has_pin} />;
}
