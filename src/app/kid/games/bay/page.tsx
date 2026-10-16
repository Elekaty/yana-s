import { PlayChoice } from "@/components/kid/play-choice";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BayPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const en = family?.child_language === "en";
  return (
    <div className="grid gap-4">
      <PlayChoice href="/kid/games/bay/bulles" title={copy.bulles} hint={en ? "Pop the right bubble" : "Éclate la bonne bulle"} emoji="🫧" tone="sun" />
      <PlayChoice href="/kid/games/bay/fruit" title={copy.fruits} hint={en ? "Slice the fruit" : "Coupe le fruit"} emoji="🍓" tone="hot" />
      <PlayChoice href="/kid/games/bay/more" title={copy.plus} hint={en ? "Kitchen, safari, say it" : "Cuisine, safari, dire"} emoji="✨" tone="grape" />
    </div>
  );
}
