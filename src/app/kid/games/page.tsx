import { IslandLink } from "@/components/kid/island-link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <IslandLink href="/kid/games/bay" className="flex h-28 items-center justify-center rounded-3xl bg-hot text-3xl" delay={0}>
        {copy.bay}
      </IslandLink>
      <IslandLink href="/kid/games/lagoon" className="flex h-28 items-center justify-center rounded-3xl bg-grape text-3xl" delay={0.4}>
        {copy.lagoon}
      </IslandLink>
      <IslandLink href="/kid/games/cove" className="flex h-28 items-center justify-center rounded-3xl bg-sun text-3xl text-plum" delay={0.8}>
        {copy.cove}
      </IslandLink>
    </div>
  );
}
