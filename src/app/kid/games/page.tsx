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
      <p className="flex h-28 items-center justify-center rounded-3xl bg-white/10 text-3xl">
        {copy.lagoon}
        <span className="ml-3 text-lg">{copy.soon}</span>
      </p>
      <p className="flex h-28 items-center justify-center rounded-3xl bg-white/10 text-3xl">
        {copy.cove}
        <span className="ml-3 text-lg">{copy.soon}</span>
      </p>
    </div>
  );
}
