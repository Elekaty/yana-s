import "server-only";

import { cookies } from "next/headers";
import { PARENT_UNLOCK_COOKIE, signUnlock } from "@/lib/pin-cookie";
import { REMEMBER_COOKIE, REMEMBER_SECONDS, wantsRemember } from "@/lib/supabase/remember";

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

export async function writeUnlockCookie(userId: string, familyId: string) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not set");
  const store = await cookies();
  const remember = wantsRemember(store.get(REMEMBER_COOKIE)?.value);
  const lifetime = remember ? REMEMBER_SECONDS : undefined;
  store.set(PARENT_UNLOCK_COOKIE, await signUnlock(userId, familyId, secret, undefined, lifetime), cookieOptions(lifetime));
}

export async function clearUnlockCookie() {
  const store = await cookies();
  store.set(PARENT_UNLOCK_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
