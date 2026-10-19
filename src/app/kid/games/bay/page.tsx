import { KidBack } from "@/components/kid/kid-back";
import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { bayCards, kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

const cardLook = {
  "/kid/games/bay/bulles": { key: "bulles", emoji: "🫧", tone: "sun" },
  "/kid/games/bay/fruit": { key: "fruits", emoji: "🍓", tone: "hot" },
  "/kid/games/bay/kitchen": { key: "kitchen", emoji: "🍎", tone: "grape" },
} as const;

export default async function BayPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-3">
      <KidBack href={kidPlaces.games} label={copy.back} />
      {bayCards.map((href) => {
        const look = cardLook[href];
        return <PlayChoice key={href} primary href={href} title={copy[look.key]} emoji={look.emoji} tone={look.tone} />;
      })}
    </div>
  );
}
