import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaryKeys, t } from "@/lib/i18n";
import { MOCHI_STATES } from "@/lib/mochi";
import { fillPhrase, phrases } from "@/lib/phrases";
import { readUnlock, signUnlock } from "@/lib/pin-cookie";

describe("phrases and languages", () => {
  it("fills the child's name into a scripted line", () => {
    expect(fillPhrase(phrases.greetDay.fr, "Yana")).toBe("Coucou Yana !");
    expect(fillPhrase(phrases.greetDay.en, "Yana")).toBe("Hello, Yana!");
  });

  it("gives French and English the same kid-screen keys", () => {
    expect(Object.keys(t("en")).sort()).toEqual(Object.keys(t("fr")).sort());
    expect(dictionaryKeys).toContain("home");
  });
});

describe("Mochi", () => {
  it("includes every salon state from the rules", () => {
    expect(MOCHI_STATES).toEqual([
      "idle",
      "wander",
      "chase-yarn",
      "nap",
      "purr",
      "cheer",
      "think",
      "sleepy-at-bedtime",
      "greet",
    ]);
  });
});

describe("parent unlock cookie", () => {
  const secret = "test-secret";

  it("round-trips a signed unlock and rejects tampering", async () => {
    const token = await signUnlock("user-1", "family-1", secret, 1_000);
    await expect(readUnlock(token, secret, 1_000)).resolves.toMatchObject({ sub: "user-1", fam: "family-1" });
    await expect(readUnlock(token, "other-secret", 1_000)).resolves.toBeNull();
    await expect(readUnlock(`${token}x`, secret, 1_000)).resolves.toBeNull();
    await expect(readUnlock(token, secret, 1_000 + 60 * 60 * 13)).resolves.toBeNull();
  });
});

describe("secrets stay on the server", () => {
  it("does not mention the service role outside the admin client", () => {
    const files = walk("src").filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      const normalized = file.replaceAll("\\", "/");
      if (normalized.endsWith("src/lib/supabase/admin.ts")) continue;
      expect(text, normalized).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(text, normalized).not.toContain("supabase/admin");
    }
  });
});

describe("critical SQL", () => {
  const sql = readFileSync("supabase/migrations/0001_core.sql", "utf8");

  it("keeps the archive and star functions from the plan", () => {
    expect(sql).toContain("raise exception 'both parents must tick first'");
    expect(sql).toContain("if p_amount < 1 or p_amount > 5 then raise exception 'bad amount'");
    expect(sql).toContain("if today_total >= 60 then return (select star_balance from children where id=p_child)");
    expect(sql).not.toMatch(/create policy messages_\w+ on messages for delete/i);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
