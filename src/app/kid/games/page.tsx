import { CrewStrip } from "@/components/mochi/crew-strip";
import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { crewWithStarter } from "@/lib/mochi/crew";
import { ensureStarterFriend } from "@/lib/mochi/starter";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  if (family?.child_id) await ensureStarterFriend(supabase, family.family_id, family.child_id);
  const { data: met } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  const crew = crewWithStarter((met ?? []).map((row) => String(row.friend)));
  return (
    <div className="grid gap-4">
      <CrewStrip crew={crew} lang={en ? "en" : "fr"} childName={family?.child_name ?? ""} />
      <PlayChoice href="/kid/games/bay" title={copy.bay} hint={en ? "Bubbles and fruit" : "Bulles et fruits"} emoji="🫧" tone="hot" />
      <PlayChoice href="/kid/games/lagoon" title={copy.lagoon} hint={en ? "A path of arrows" : "Un chemin de flèches"} emoji="🌊" tone="grape" />
      <PlayChoice href="/kid/games/cove" title={copy.cove} hint={en ? "Draw and music" : "Dessin et musique"} emoji="🎨" tone="sun" />
    </div>
  );
}
