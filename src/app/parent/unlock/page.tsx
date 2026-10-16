import { redirect } from "next/navigation";
import { UnlockForm } from "@/app/parent/unlock/unlock-form";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const { user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  return <UnlockForm hasPin={family.has_pin} />;
}
