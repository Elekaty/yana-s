import { SafariPlay } from "@/components/kid/safari-play";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function SafariPage() {
  const { family } = await getFamily();
  const lang = family?.child_language === "en" ? "en" : "fr";
  return <SafariPlay lang={lang} copy={t(lang)} />;
}
