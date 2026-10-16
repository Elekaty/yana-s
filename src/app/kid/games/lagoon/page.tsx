import { LagoonPlay } from "@/components/kid/lagoon-play";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function LagoonPage() {
  const { family } = await getFamily();
  return <LagoonPlay copy={t(family?.child_language)} />;
}
