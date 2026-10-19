import type { SupabaseClient } from "@supabase/supabase-js";
import { STARTER_FRIEND } from "@/lib/mochi/crew";

export async function ensureStarterFriend(supabase: SupabaseClient, familyId: string, childId: string) {
  await supabase.from("friends_unlocked").upsert(
    { family_id: familyId, child_id: childId, friend: STARTER_FRIEND },
    { onConflict: "child_id,friend", ignoreDuplicates: true },
  );
}
