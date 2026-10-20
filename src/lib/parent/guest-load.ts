import "server-only";

import { displayTitle } from "@/lib/calendar/plan";
import { guestLinkStatus } from "@/lib/parent/guest";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadGuestView(token: string, now = new Date()) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  try {
    const admin = createAdminClient();
    const { data: families } = await admin.from("families").select("id, settings");
    const family = (families ?? []).find((row) => {
      const settings = row.settings as { guest_token?: string; guest_expires_at?: string } | null;
      return guestLinkStatus({
        token: String(settings?.guest_token ?? ""),
        expiresAt: String(settings?.guest_expires_at ?? ""),
        now,
      }) === "active" && settings?.guest_token === token;
    });
    if (!family) return null;
    const [{ data: child }, { data: events }] = await Promise.all([
      admin.from("children").select("name, star_balance").eq("family_id", family.id).limit(1).maybeSingle(),
      admin.from("events").select("title, starts_at").eq("family_id", family.id).gte("starts_at", now.toISOString()).order("starts_at").limit(5),
    ]);
    return {
      childName: String(child?.name ?? "Yana"),
      stars: Number(child?.star_balance ?? 0),
      events: (events ?? []).map((event) => displayTitle(String(event.title ?? "Event"))),
    };
  } catch {
    return null;
  }
}
