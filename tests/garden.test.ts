import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GARDEN, buildingShopOn, gardenTheme } from "@/lib/garden/kinds";

describe("garden", () => {
  it("grows the twelve kinds in order", () => {
    expect(GARDEN.map((item) => item.id)).toEqual([
      "flower",
      "tree",
      "bee",
      "house",
      "sunflower",
      "fountain",
      "butterfly",
      "bakery",
      "mushroom",
      "carousel",
      "rainbow",
      "castle",
    ]);
  });

  it("uses that same order in the database function", () => {
    const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/0012_garden.sql"), "utf8");
    let last = -1;
    for (const item of GARDEN) {
      const at = sql.indexOf(`'${item.id}'`);
      expect(at).toBeGreaterThan(last);
      last = at;
    }
    expect(sql).toContain("Does not change stars");
  });

  it("keeps the building shop off unless a parent enabled it", () => {
    expect(buildingShopOn(null)).toBe(false);
    expect(buildingShopOn({})).toBe(false);
    expect(buildingShopOn({ building_shop: true })).toBe(true);
  });

  it("unlocks the night garden the month after the last plant", () => {
    expect(gardenTheme(null, new Date("2026-10-19T10:00:00Z"))).toBe("day");
    expect(gardenTheme("2026-10-02T10:00:00Z", new Date("2026-10-19T10:00:00Z"))).toBe("day");
    expect(gardenTheme("2026-10-19T10:00:00Z", new Date("2026-11-01T10:00:00Z"))).toBe("night");
  });
});
