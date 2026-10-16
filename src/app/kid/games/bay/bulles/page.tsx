import { TimesRound } from "@/components/kid/times-round";
import { getFamily } from "@/lib/family";
import { tablesFrom } from "@/lib/games/questions";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BullesPage() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  return (
    <div className="space-y-4">
      <TimesRound game="bulles" level="easy" tables={tablesFrom(child?.settings)} copy={copy} />
    </div>
  );
}
