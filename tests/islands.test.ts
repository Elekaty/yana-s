import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FRERE_JACQUES, songMatches } from "@/lib/games/cove";
import { gradeKitchen, orderAt, orderText, plateMatches, emptyPlate } from "@/lib/games/kitchen";
import { LEVELS, cleared } from "@/lib/games/lagoon";
import { gradeSafari, safariAt } from "@/lib/games/safari";
import { TOWN_ITEMS } from "@/lib/games/town";

describe("islands", () => {
  it("clears each lagoon level only with a path that reaches the strawberry", () => {
    expect(LEVELS.map((level) => level.solution.length)).toEqual([2, 3, 4, 6, 8]);
    for (const level of LEVELS) {
      expect(cleared(level, level.solution)).toBe(true);
      expect(cleared(level, ["up"])).toBe(false);
    }
  });

  it("grades five kitchen orders from the French counts", () => {
    expect(orderText(orderAt(0), "fr")).toBe("une pomme");
    const plates = [0, 1, 2, 3, 4].map((index) => {
      const plate = emptyPlate();
      for (const line of orderAt(index)) plate[line.item] = line.count;
      expect(plateMatches(orderAt(index), plate)).toBe(true);
      return plate;
    });
    expect(gradeKitchen(plates)).toEqual({ correct: 5, stars: 2 });
    plates[0] = emptyPlate();
    expect(gradeKitchen(plates).stars).toBe(0);
  });

  it("keeps the safari answer inside three animals", () => {
    const round = safariAt(1);
    expect(round.choices).toHaveLength(3);
    expect(round.choices).toContain(round.answer);
    const picks = [0, 1, 2, 3, 4].map((index) => safariAt(index).answer);
    expect(gradeSafari(picks)).toEqual({ correct: 5, stars: 2 });
  });

  it("uses the public-domain melody and the town prices from the plan", () => {
    expect(songMatches([...FRERE_JACQUES])).toBe(true);
    expect(songMatches(["C4"])).toBe(false);
    expect(TOWN_ITEMS.map((item) => item.cost)).toEqual([1, 2, 5, 6, 8, 8, 12, 20]);
    const sql = readFileSync("supabase/migrations/0009_town.sql", "utf8");
    expect(sql.startsWith("-- 0009 town")).toBe(true);
    expect(sql).toContain("buy_town_item");
    expect(sql).toContain("when 'castle' then 20");
  });
});
