import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <Link href="/kid/games/bay" className="flex h-28 items-center justify-center rounded-3xl bg-hot text-3xl">
        {copy.bay}
      </Link>
      <Link href="/kid/games/voice" className="flex h-28 items-center justify-center rounded-3xl bg-grape text-3xl">
        {copy.say}
      </Link>
      <Link href="/kid/games/stories" className="flex h-28 items-center justify-center rounded-3xl bg-sun text-3xl text-plum">
        {copy.stories}
      </Link>
    </div>
  );
}
