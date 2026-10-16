import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BayPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-4">
      <Link href="/kid/games/bay/bulles" className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        {copy.bulles}
      </Link>
      <Link href="/kid/games/bay/fruit" className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.fruits}
      </Link>
      <Link href="/kid/games/bay/more" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.plus}
      </Link>
    </div>
  );
}
