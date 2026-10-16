import { DrawBoard } from "@/components/kid/draw-board";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DrawPage() {
  const { family } = await getFamily();
  return <DrawBoard copy={t(family?.child_language)} lang={family?.child_language === "en" ? "en" : "fr"} />;
}
