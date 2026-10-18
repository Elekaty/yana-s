export const REMEMBER_COOKIE = "mf_remember";
export const REMEMBER_SECONDS = 60 * 60 * 24 * 30;

export function wantsRemember(value: string | undefined) {
  return value !== "0";
}

export function authCookieOptions(remember: boolean) {
  const base = {
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  return remember ? { ...base, maxAge: REMEMBER_SECONDS } : base;
}
