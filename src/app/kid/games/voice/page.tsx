import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <Link href="/kid/games/voice/practice" className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        {copy.practice}
      </Link>
      <Link href="/kid/games/voice/new" className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.whatsNew}
      </Link>
      <Link href="/kid/games/voice/album" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.album}
      </Link>
    </div>
  );
}
