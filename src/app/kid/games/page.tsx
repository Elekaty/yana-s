import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  return (
    <div className="grid gap-4">
      <PlayChoice href="/kid/games/bay" title={copy.bay} hint={en ? "Bubbles, fruit, and words" : "Bulles, fruits et mots"} emoji="🫧" tone="hot" />
      <PlayChoice href="/kid/games/lagoon" title={copy.lagoon} hint={en ? "A path of arrows" : "Un chemin de flèches"} emoji="🌊" tone="grape" />
      <PlayChoice href="/kid/games/cove" title={copy.cove} hint={en ? "Draw, paint, and stickers" : "Dessin, peinture et collages"} emoji="🎨" tone="sun" />
      <PlayChoice href="/kid/games/stories" title={copy.stories} hint={en ? "Listen page by page" : "Écoute page par page"} emoji="📖" tone="sun" />
      <PlayChoice href="/kid/games/friends" title={en ? "My friends" : "Mes amis"} hint={en ? "Friends from the salon" : "Les amis du salon"} emoji="🐰" tone="hot" />
      <PlayChoice href="/kid/town" title={copy.town} hint={en ? "Spend stars on a plot" : "Dépense des étoiles"} emoji="🏡" tone="grape" />
    </div>
  );
}
