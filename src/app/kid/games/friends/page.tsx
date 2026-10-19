import { FriendMark } from "@/components/mochi/friend-mark";
import { KidBack } from "@/components/kid/kid-back";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";
import { friendCards } from "@/lib/mochi/friends";
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
  const cards = friendCards((data ?? []).map((row) => String(row.friend)), lang);
  return (
    <div className="grid gap-4">
      <h1 className="text-4xl">{lang === "en" ? "My friends" : "Mes amis"}</h1>
      {cards.map((card) => (
        <p
          key={card.id}
          aria-label={card.locked ? copy.notYet : card.name}
          className={card.locked ? "flex min-h-20 items-center justify-center gap-3 rounded-full bg-[#14081f] px-4 text-2xl text-white" : "flex min-h-20 items-center justify-center gap-3 rounded-full bg-sun px-4 text-plum"}
        >
          <FriendMark friend={card.id} locked={card.locked} />
          {card.locked ? null : (
            <span className="text-center">
              <span className="block text-2xl">{card.name}</span>
              <span className="block text-base">{card.line}</span>
            </span>
          )}
        </p>
      ))}
      <KidBack href={kidPlaces.corner} label={copy.back} />
    </div>
  );
}
