import Link from "next/link";
import { GardenBed } from "@/components/kid/garden-bed";
import { KidBack } from "@/components/kid/kid-back";
import { KidMochi } from "@/components/kid/kid-mochi";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";
import { buildingShopOn } from "@/lib/garden/kinds";
import { crewWithStarter } from "@/lib/mochi/crew";
import { ensureStarterFriend } from "@/lib/mochi/starter";
import type { BubbleFriend } from "@/lib/mochi";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  if (family?.child_id) await ensureStarterFriend(supabase, family.family_id, family.child_id);
  const { data: familyRow } = family
    ? await supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle()
    : { data: null };
  const shop = buildingShopOn(familyRow?.settings);
  const [{ data: items }, { data: met }, { data: child }] = family?.child_id
    ? await Promise.all([
        supabase.from("garden_items").select("slot, kind, planted_at").eq("child_id", family.child_id).order("slot"),
        supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id),
        supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle(),
      ])
    : [{ data: [] }, { data: [] }, { data: null }];
  const rows = items ?? [];
  const full = rows.find((row) => row.slot === 11);
  const voice = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  return (
    <div className="grid gap-3">
      <KidBack href={kidPlaces.corner} label={copy.back} />
      <KidMochi />
      {shop ? (
        <Link href={kidPlaces.town} className="flex h-16 items-center justify-center rounded-full bg-grape text-2xl text-white">
          {copy.town}
        </Link>
      ) : null}
      <GardenBed
        planted={rows.map((row) => ({ slot: row.slot, kind: row.kind }))}
        fullAt={full?.planted_at ?? null}
        friends={crewWithStarter((met ?? []).map((row) => String(row.friend))) as BubbleFriend[]}
        lang={lang}
        voice={voice}
        fullLabel={copy.doneTitle}
      />
    </div>
  );
}
