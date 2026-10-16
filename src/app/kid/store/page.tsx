import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return <h1 className="text-4xl">{copy.storeBody}</h1>;
}
