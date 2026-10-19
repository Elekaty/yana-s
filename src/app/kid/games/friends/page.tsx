import { FriendMark } from "@/components/mochi/friend-mark";
import { KidBack } from "@/components/kid/kid-back";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";
import { BUBBLE_FRIENDS } from "@/lib/mochi";
import { crewWithStarter } from "@/lib/mochi/crew";
import { FRIEND_CAST } from "@/lib/mochi/friends";
import { ensureStarterFriend } from "@/lib/mochi/starter";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  if (family?.child_id) await ensureStarterFriend(supabase, family.family_id, family.child_id);
  const { data } = family?.child_id
    ? await supabase.from("friends_unlocked").select("friend").eq("child_id", family.child_id)
    : { data: [] };
  const unlocked = new Set(crewWithStarter((data ?? []).map((row) => String(row.friend))));
  return (
    <div className="grid gap-4">
      <h1 className="text-4xl">{lang === "en" ? "My friends" : "Mes amis"}</h1>
      {BUBBLE_FRIENDS.map((friend) => {
        const met = unlocked.has(friend);
        return (
          <p
            key={friend}
            className={met ? "flex h-20 items-center justify-center gap-3 rounded-full bg-sun text-2xl text-plum" : "flex h-20 items-center justify-center gap-3 rounded-full bg-[#14081f] text-2xl text-white"}
          >
            <FriendMark friend={friend} locked={!met} />
            {met ? FRIEND_CAST[friend].name : "?"}
          </p>
        );
      })}
      <KidBack href={kidPlaces.corner} label={copy.back} />
    </div>
  );
}
