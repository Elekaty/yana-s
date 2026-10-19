import { KidMochi } from "@/components/kid/kid-mochi";
import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { gameIslands } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

const islandLook = {
  "/kid/games/bay": { key: "bay", emoji: "🏝️", tone: "hot" },
  "/kid/games/lagoon": { key: "lagoon", emoji: "🌊", tone: "grape" },
  "/kid/games/cove": { key: "cove", emoji: "🎨", tone: "sun" },
} as const;

export default async function GamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-3">
      <KidMochi />
      {gameIslands.map((href) => {
        const look = islandLook[href];
        return <PlayChoice key={href} primary href={href} title={copy[look.key]} emoji={look.emoji} tone={look.tone} />;
      })}
    </div>
  );
}
