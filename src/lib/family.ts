import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { BUILD_PREVIEW, previewFamily } from "@/lib/preview";
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
  if (!user) {
    if (!BUILD_PREVIEW) return { supabase, user: null, family: null as FamilySummary | null };
    const jar = await cookies();
    const child_language: "fr" | "en" = jar.get("mf_lang")?.value === "en" ? "en" : "fr";
    return { supabase, user: null, family: { ...previewFamily, child_language } };
  }
  const { data, error } = await supabase.rpc("my_family");
  if (error) throw new Error(error.message);
  return { supabase, user, family: (data ?? null) as FamilySummary | null };
}
