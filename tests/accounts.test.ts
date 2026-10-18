import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
  it("keeps a phone session for 400 days", () => {
    expect(REMEMBER_SECONDS).toBe(60 * 60 * 24 * 400);
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
    const login = readFileSync(path.join(process.cwd(), "src", "app", "login", "page.tsx"), "utf8");
    const join = readFileSync(path.join(process.cwd(), "src", "app", "join", "page.tsx"), "utf8");
    expect(login).not.toMatch(/type="password"|Your name|email/i);
    expect(join).toContain("Join with a code");
  });
});