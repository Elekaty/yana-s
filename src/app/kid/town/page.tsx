import Link from "next/link";
import { redirect } from "next/navigation";
import { TownBoard } from "@/components/kid/town-board";
import { getFamily } from "@/lib/family";
import { buildingShopOn } from "@/lib/garden/kinds";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function TownPage() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const { data: familyRow } = await supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle();
  if (!buildingShopOn(familyRow?.settings)) redirect(kidPlaces.garden);
  const copy = t(family.child_language);
  const lang = family.child_language === "en" ? "en" : "fr";
  const [{ data: plots, error }, { data: friends }] = await Promise.all([
    supabase.from("town_plots").select("slot, item").eq("child_id", family.child_id),
    supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id),
  ]);
  if (error) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-2xl">{lang === "en" ? "The town is not ready yet." : "La ville n'est pas prête."}</p>
        <Link href="/kid/corner" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }
  return (
    <TownBoard
      lang={lang}
      copy={copy}
      balance={family.star_balance}
      plots={plots ?? []}
      friends={(friends ?? []).map((row) => row.friend)}
    />
  );
}
