import "server-only";
import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";

export async function requireParent() {
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  return { supabase, user, family };
}
