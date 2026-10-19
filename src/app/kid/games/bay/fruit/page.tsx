import Link from "next/link";
import { TimesRound } from "@/components/kid/times-round";
import { getFamily } from "@/lib/family";
import { tablesFrom, type FruitLevel } from "@/lib/games/questions";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function FruitPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const level = (await searchParams).level;
  if (level !== "easy" && level !== "medium") {
    return (
      <div className="grid gap-4">
        <Link href="/kid/games/bay/fruit?level=easy" className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum">
          {copy.easy}
        </Link>
        <Link href="/kid/games/bay/fruit?level=medium" className="flex h-16 items-center justify-center rounded-full bg-hot text-2xl">
          {copy.medium}
        </Link>
        <Link href="/kid/games/bay" className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  return <TimesRound game="fruit" level={level as FruitLevel} tables={tablesFrom(child?.settings)} copy={copy} />;
}
