import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOGIN_LOCK_SECONDS, LOGIN_MAX_TRIES, loginLocked, nextLoginGuard } from "@/lib/login-guard";
import { REMEMBER_SECONDS, authCookieOptions } from "@/lib/supabase/remember";

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...filesUnder(full));
    else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) found.push(full);
  }
  return found;
}

describe("accounts", () => {
  it("locks sign-in for 5 minutes after 5 wrong tries", () => {
    let guard = { fails: 0, until: 0 };
    for (let tryNumber = 1; tryNumber < LOGIN_MAX_TRIES; tryNumber += 1) {
      guard = nextLoginGuard(guard, 1000, false);
      expect(loginLocked(guard, 1000)).toBe(false);
    }
    guard = nextLoginGuard(guard, 1000, false);
    expect(loginLocked(guard, 1000 + LOGIN_LOCK_SECONDS - 1)).toBe(true);
    expect(loginLocked(guard, 1000 + LOGIN_LOCK_SECONDS)).toBe(false);
    expect(nextLoginGuard(guard, 1000, true)).toEqual({ fails: 0, until: 0 });
  });

  it("ends a remembered sign-in after 30 days", () => {
    expect(REMEMBER_SECONDS).toBe(60 * 60 * 24 * 30);
    const remembered = authCookieOptions(true);
    const session = authCookieOptions(false);
    expect("maxAge" in remembered ? remembered.maxAge : 0).toBe(REMEMBER_SECONDS);
    expect("maxAge" in session).toBe(false);
  });

  it("keeps the word preview out of the app screens", () => {
    const root = path.join(process.cwd(), "src");
    const hits = filesUnder(root).filter((file) => /\bpreview\b/i.test(readFileSync(file, "utf8")));
    expect(hits).toEqual([]);
  });

  it("lets a second parent join with a generated code", () => {
    const sql = readFileSync(path.join(process.cwd(), "supabase", "migrations", "0001_core.sql"), "utf8");
    expect(sql).toContain("code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))");
    expect(sql).toContain("if parents >= 2 then raise exception 'family already has two parents'");
    expect(sql.toLowerCase()).not.toContain("preview");
    const login = readFileSync(path.join(process.cwd(), "src", "app", "login", "form.tsx"), "utf8");
    const join = readFileSync(path.join(process.cwd(), "src", "app", "join", "page.tsx"), "utf8");
    expect(login).toContain("Join with a code");
    expect(join).toContain("Join with a code");
  });
});