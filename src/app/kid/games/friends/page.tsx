import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const names: Record<string, { fr: string; en: string }> = {
  bunny: { fr: "lapin", en: "bunny" },
  panda: { fr: "panda", en: "panda" },
  fox: { fr: "renard", en: "fox" },
  corgi: { fr: "corgi", en: "corgi" },
  hamster: { fr: "hamster", en: "hamster" },
};

export default async function FriendsPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  const { data } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  const friends = data ?? [];
  return (
    <div className="grid gap-4">
      <h1 className="text-4xl">{lang === "en" ? "My friends" : "Mes amis"}</h1>
      {friends.length === 0 ? (
        <p className="rounded-[28px] bg-white/10 px-4 py-6 text-center text-2xl ring-2 ring-sun/70">
          {lang === "en" ? "Tap a friend in the salon." : "Touche un ami dans le salon."}
        </p>
      ) : (
        friends.map((row) => (
          <p key={row.friend} className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum">
            {names[row.friend]?.[lang] ?? row.friend}
          </p>
        ))
      )}
      <Link href="/kid/home" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}
