import Link from "next/link";
import { KidBack } from "@/components/kid/kid-back";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <KidBack href={kidPlaces.words} label={copy.back} />
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
