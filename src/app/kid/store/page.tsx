import Link from "next/link";
import { requestRewardForm } from "@/app/kid/games/island-actions";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StorePage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const { data } = family
    ? await supabase.from("rewards").select("id, title, cost_stars").eq("family_id", family.family_id).eq("active", true).order("cost_stars")
    : { data: [] };
  const rewards = data ?? [];
  if (rewards.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-2xl">{copy.soon}</p>
        <Link href="/kid/town" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
          {copy.town}
        </Link>
        <Link href="/kid/home" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }
  const index = Math.max(0, Number((await searchParams).i) || 0) % rewards.length;
  const reward = rewards[index];
  const next = (index + 1) % rewards.length;
  return (
    <div className="grid gap-4">
      <p className="text-center text-xl">
        {family?.star_balance ?? 0} {copy.stars}
      </p>
      <p className="text-center text-3xl">{reward.title}</p>
      <p className="text-center text-2xl">{reward.cost_stars}</p>
      <form action={requestRewardForm}>
        <input type="hidden" name="id" value={reward.id} />
        <button type="submit" className="flex h-14 w-full items-center justify-center rounded-full bg-sun text-2xl text-plum">
          {copy.ask}
        </button>
      </form>
      <Link href={`/kid/store?i=${next}`} className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.next}
      </Link>
      <Link href="/kid/town" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.town}
      </Link>
    </div>
  );
}
