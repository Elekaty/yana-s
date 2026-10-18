import "server-only";

import { NATIONAL_HOLIDAYS } from "@/lib/calendar/plan";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureHolidays() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("school_calendar").select("label, starts_on").is("family_id", null);
  if (error) throw new Error(error.message);
  const known = new Set((data ?? []).map((row) => `${row.label}|${row.starts_on}`));
  const missing = NATIONAL_HOLIDAYS.filter((holiday) => !known.has(`${holiday.label}|${holiday.starts_on}`)).map((holiday) => ({
    ...holiday,
    family_id: null,
  }));
  if (missing.length === 0) return;
  const inserted = await admin.from("school_calendar").insert(missing);
  if (inserted.error) throw new Error(inserted.error.message);
}
