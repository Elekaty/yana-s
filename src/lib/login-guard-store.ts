import "server-only";

import { cookies } from "next/headers";
import { LOGIN_GUARD_COOKIE, type LoginGuard } from "@/lib/login-guard";

function options(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function mac(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  let binary = "";
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function readLoginGuard(): Promise<LoginGuard> {
  const secret = process.env.CRON_SECRET;
  const raw = (await cookies()).get(LOGIN_GUARD_COOKIE)?.value;
  if (!secret || !raw) return { fails: 0, until: 0 };
  const [body, signature] = raw.split(".");
  if (!body || !signature || signature !== (await mac(secret, body))) return { fails: 0, until: 0 };
  try {
    const payload = JSON.parse(atob(body)) as LoginGuard;
    if (typeof payload.fails !== "number" || typeof payload.until !== "number") return { fails: 0, until: 0 };
    return payload;
  } catch {
    return { fails: 0, until: 0 };
  }
}

export async function writeLoginGuard(guard: LoginGuard) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  const body = btoa(JSON.stringify(guard));
  const value = `${body}.${await mac(secret, body)}`;
  (await cookies()).set(LOGIN_GUARD_COOKIE, value, options(guard.until > 0 ? 15 * 60 : 60 * 60));
}
