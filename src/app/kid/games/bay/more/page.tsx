import { KidBack } from "@/components/kid/kid-back";
import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function MoreGamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  return (
    <div className="grid gap-4">
      <KidBack href={kidPlaces.bay} label={copy.back} />
      <PlayChoice href="/kid/games/bay/kitchen" title={copy.kitchen} hint={en ? "Fill the plate" : "Remplis l'assiette"} emoji="🍎" tone="sun" />
    </div>
  );
}
