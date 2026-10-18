import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function openDeviceSession(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;

  const id = crypto.randomUUID();
  const email = `phone.${id}@signin.yana-s.app`;
  const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  try {
    const admin = createAdminClient();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { device: true },
    });
    if (created.error || !created.data.user) return null;
  } catch {
    return null;
  }

  const signed = await supabase.auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.user) return null;
  return signed.data.user;
}

export function needsDevice(path: string) {
  return path === "/" || path === "/login" || path.startsWith("/join") || path.startsWith("/parent") || path.startsWith("/kid");
}
