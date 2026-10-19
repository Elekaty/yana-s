import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { BUBBLE_FRIENDS } from "@/lib/mochi";
import { FRIEND_CAST } from "@/lib/mochi/friends";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  const { data } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  const unlocked = new Set((data ?? []).map((row) => row.friend));
  return (
    <div className="grid gap-4">
      <h1 className="text-4xl">{lang === "en" ? "My friends" : "Mes amis"}</h1>
      {BUBBLE_FRIENDS.map((friend) => {
        const met = unlocked.has(friend);
        return (
          <p
            key={friend}
            className={met ? "flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum" : "flex h-16 items-center justify-center rounded-full bg-plum text-2xl text-white/40 ring-2 ring-white/20"}
          >
            {met ? FRIEND_CAST[friend].name : "···"}
          </p>
        );
      })}
      <Link href="/kid/home" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}
