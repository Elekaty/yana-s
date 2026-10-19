import Link from "next/link";
import { requestRewardForm } from "@/app/kid/games/island-actions";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { readPrizeState } from "@/lib/prizes";

export const dynamic = "force-dynamic";

const stickerName: Record<string, { fr: string; en: string }> = {
  sun: { fr: "soleil", en: "sun" },
  heart: { fr: "cœur", en: "heart" },
  moon: { fr: "lune", en: "moon" },
  yarn: { fr: "laine", en: "yarn" },
  flower: { fr: "fleur", en: "flower" },
};

export default async function StorePage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  const [{ data }, { data: pending }, { data: child }] = family
    ? await Promise.all([
        supabase.from("rewards").select("id, title, cost_stars").eq("family_id", family.family_id).eq("active", true).order("cost_stars"),
        supabase.from("purchases").select("reward_id").eq("child_id", family.child_id).eq("status", "requested"),
        family.child_id
          ? supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ])
    : [{ data: [] }, { data: [] }, { data: null }];
  const rewards = data ?? [];
  const asked = new Set((pending ?? []).map((row) => row.reward_id));
  const prizes = readPrizeState(child?.settings);
  const chest = chestLine(prizes.lastChest, lang);
  if (rewards.length === 0) {
    return (
      <div className="grid gap-4">
        {chest ? <p className="text-center text-xl">{chest}</p> : null}
        <p className="rounded-[28px] bg-white/10 px-4 py-6 text-center text-2xl ring-2 ring-sun/70">
          {lang === "en" ? "Ask a parent to add a prize." : "Demande à un parent d'ajouter un prix."}
        </p>
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
  const waiting = asked.has(reward.id);
  return (
    <div className="grid gap-4">
      <p className="text-center text-xl">
        {family?.star_balance ?? 0} {copy.stars}
      </p>
      {chest ? <p className="text-center text-xl">{chest}</p> : null}
      <p className="text-center text-3xl">{reward.title}</p>
      <p className="text-center text-2xl">{reward.cost_stars}</p>
      {waiting ? (
        <p className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {lang === "en" ? "Asked" : "Demandé"}
        </p>
      ) : (
        <form action={requestRewardForm}>
          <input type="hidden" name="id" value={reward.id} />
          <button type="submit" className="flex h-14 w-full items-center justify-center rounded-full bg-sun text-2xl text-plum">
            {copy.ask}
          </button>
        </form>
      )}
      <Link href={`/kid/store?i=${next}`} className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
        {copy.next}
      </Link>
      <Link href="/kid/town" className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.town}
      </Link>
    </div>
  );
}

function chestLine(lastChest: string, lang: "fr" | "en") {
  if (lastChest.startsWith("stars:")) {
    const amount = lastChest.slice(6);
    return lang === "en" ? `Chest: ${amount} stars` : `Coffre : ${amount} étoiles`;
  }
  if (lastChest.startsWith("sticker:")) {
    const name = stickerName[lastChest.slice(8)];
    const label = name ? (lang === "en" ? name.en : name.fr) : "";
    return lang === "en" ? `Chest: a ${label} sticker` : `Coffre : un autocollant ${label}`;
  }
  if (lastChest === "dance") return lang === "en" ? "Chest: a dance" : "Coffre : une danse";
  if (lastChest.startsWith("friend:")) return lang === "en" ? "Chest: a new friend" : "Coffre : un nouvel ami";
  return "";
}
