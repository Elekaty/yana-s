import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MoreGamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  return (
    <div className="grid gap-4">
      <PlayChoice href="/kid/games/bay/kitchen" title={copy.kitchen} hint={en ? "Fill the plate" : "Remplis l'assiette"} emoji="🍎" tone="sun" />
      <PlayChoice href="/kid/games/bay/safari" title={copy.safari} hint={en ? "Find the animal" : "Trouve l'animal"} emoji="🐰" tone="hot" />
      <PlayChoice href="/kid/games/voice" title={copy.say} hint={en ? "Listen and say it" : "Écoute et dis-le"} emoji="🗣️" tone="grape" />
    </div>
  );
}
