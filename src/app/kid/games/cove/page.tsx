import { KidBack } from "@/components/kid/kid-back";
import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function CovePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-3">
      <KidBack href={kidPlaces.games} label={copy.back} />
      <PlayChoice href="/kid/games/cove/draw" title={copy.draw} emoji="✏️" tone="sun" />
      <PlayChoice href="/kid/games/cove/music" title={copy.music} emoji="🎵" tone="hot" />
    </div>
  );
}
