import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CovePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  return (
    <div className="grid gap-4">
      <PlayChoice href="/kid/games/cove/draw" title={copy.draw} hint={en ? "Colors, pictures, and paint" : "Couleurs, images et peinture"} emoji="✏️" tone="sun" />
      <PlayChoice href="/kid/games/cove/music" title={copy.music} hint={en ? "Play the song" : "Joue la chanson"} emoji="🎵" tone="hot" />
      <PlayChoice href="/kid/games/stories" title={copy.stories} hint={en ? "Listen to a story" : "Écoute une histoire"} emoji="📖" tone="grape" />
    </div>
  );
}
