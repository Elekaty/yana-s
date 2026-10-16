import { describe, expect, it } from "vitest";
import { animalsFor, entriesFor, kitchenFoods } from "@/lib/dictionary";
import { orderText, orderAt } from "@/lib/games/kitchen";
import { safariAt } from "@/lib/games/safari";

describe("dictionary", () => {
  it("loads CE1 words when no tags are given", () => {
    const words = entriesFor();
    expect(words.some((entry) => entry.tag === "animals")).toBe(true);
    expect(words.some((entry) => entry.tag === "food")).toBe(true);
    expect(words.some((entry) => entry.tag === "math_addition")).toBe(false);
    expect(animalsFor().length).toBeGreaterThanOrEqual(3);
    expect(kitchenFoods().map((food) => food.id)).toEqual(["pomme", "biscuit", "jus"]);
    expect(orderText(orderAt(0), "fr")).toBe("une pomme");
  });

  it("pulls addition or a named food when those tags are asked for", () => {
    expect(entriesFor(["math_addition"]).every((entry) => entry.tag === "math_addition")).toBe(true);
    expect(entriesFor(["not-a-tag"]).some((entry) => entry.id === "chat")).toBe(true);
    expect(kitchenFoods(["fraise", "carotte", "gateau"]).map((food) => food.id)).toEqual(["fraise", "carotte", "gateau"]);
    expect(safariAt(0, ["chat", "chien", "lapin"]).choices).toHaveLength(3);
  });
});