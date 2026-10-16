import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CovePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <Link href="/kid/games/cove/draw" className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        {copy.draw}
      </Link>
      <Link href="/kid/games/cove/music" className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.music}
      </Link>
      <Link href="/kid/games/stories" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.stories}
      </Link>
    </div>
  );
}
