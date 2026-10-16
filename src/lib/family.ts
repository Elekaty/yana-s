import { createClient } from "@/lib/supabase/server";
import type { FamilySummary } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getFamily() {
  const { supabase, user } = await getSession();
  if (!user) return { supabase, user: null, family: null as FamilySummary | null };
  const { data, error } = await supabase.rpc("my_family");
  if (error) throw new Error(error.message);
  return { supabase, user, family: (data ?? null) as FamilySummary | null };
}
