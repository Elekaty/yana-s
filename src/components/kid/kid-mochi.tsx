import { CrewStrip } from "@/components/mochi/crew-strip";
import { getFamily } from "@/lib/family";
import { crewWithStarter } from "@/lib/mochi/crew";
import { ensureStarterFriend } from "@/lib/mochi/starter";

export async function KidMochi() {
  const { supabase, family } = await getFamily();
  const lang = family?.child_language === "en" ? "en" : "fr";
  if (family?.child_id) await ensureStarterFriend(supabase, family.family_id, family.child_id);
  const { data: met } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  return <CrewStrip crew={crewWithStarter((met ?? []).map((row) => String(row.friend)))} lang={lang} childName={family?.child_name ?? ""} />;
}
