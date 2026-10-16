import { KitchenPlay } from "@/components/kid/kitchen-play";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const { family } = await getFamily();
  const lang = family?.child_language === "en" ? "en" : "fr";
  return <KitchenPlay lang={lang} copy={t(lang)} />;
}
