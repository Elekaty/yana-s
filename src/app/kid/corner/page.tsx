import Link from "next/link";
import { KidBack } from "@/components/kid/kid-back";
import { KidMochi } from "@/components/kid/kid-mochi";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function CornerPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <KidBack href={kidPlaces.home} label={copy.back} />
        <p className="text-4xl font-semibold text-sun">{family?.star_balance ?? 0} ★</p>
      </div>
      <KidMochi />
      <Link data-primary="true" href={kidPlaces.friends} className="flex h-16 items-center justify-center gap-2 rounded-full bg-sun text-2xl text-plum shadow-[0_6px_0_#e0b520]">
        <span aria-hidden>🐾</span>
        {copy.friends}
      </Link>
      <Link data-primary="true" href={kidPlaces.garden} className="flex h-16 items-center justify-center gap-2 rounded-full bg-hot text-2xl text-white shadow-[0_6px_0_#c4186e]">
        <span aria-hidden>🌷</span>
        {copy.garden}
      </Link>
      <Link data-primary="true" href={kidPlaces.store} className="flex h-16 items-center justify-center gap-2 rounded-full bg-grape text-2xl text-white shadow-[0_6px_0_#5b21b6]">
        <span aria-hidden>🛍️</span>
        {copy.store}
      </Link>
    </div>
  );
}
