export function guestLinkStatus(input: { token: string; expiresAt: string; now: Date }) {
  if (!/^[0-9a-f-]{36}$/i.test(input.token)) return "ended" as const;
  const expires = Date.parse(input.expiresAt);
  if (!Number.isFinite(expires) || expires <= input.now.getTime()) return "ended" as const;
  return "active" as const;
}

export function readGuestLink(settings: unknown, now = new Date()) {
  const source = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {};
  const token = typeof source.guest_token === "string" ? source.guest_token : "";
  const expiresAt = typeof source.guest_expires_at === "string" ? source.guest_expires_at : "";
  if (guestLinkStatus({ token, expiresAt, now }) !== "active") return null;
  return { token, expiresAt };
}

export function demoEnabled(settings: unknown, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv !== "development") return false;
  const source = settings && typeof settings === "object" ? (settings as Record<string, unknown>) : {};
  return source.demo_next_day === true;
}

export function demoInstant(now: Date, enabled: boolean) {
  if (!enabled) return now;
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export function demoDayLabel(now: Date, timeZone: string, enabled: boolean) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "long", year: "numeric" }).format(demoInstant(now, enabled));
}
