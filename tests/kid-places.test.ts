import { describe, expect, it } from "vitest";
import { backTarget, kidPlaces } from "@/lib/kid/places";

describe("kid back targets", () => {
  it("sends Words and Corner back home", () => {
    expect(backTarget(kidPlaces.words)).toBe(kidPlaces.home);
    expect(backTarget(kidPlaces.corner)).toBe(kidPlaces.home);
  });

  it("sends talking, animals, and stories back to Words", () => {
    expect(backTarget(kidPlaces.talk)).toBe(kidPlaces.words);
    expect(backTarget("/kid/games/voice/practice")).toBe(kidPlaces.talk);
    expect(backTarget(kidPlaces.animals)).toBe(kidPlaces.words);
    expect(backTarget(kidPlaces.stories)).toBe(kidPlaces.words);
    expect(backTarget("/kid/games/stories/chat-lune")).toBe(kidPlaces.stories);
  });

  it("sends friends, the garden, and the shop back to Corner", () => {
    expect(backTarget(kidPlaces.friends)).toBe(kidPlaces.corner);
    expect(backTarget(kidPlaces.garden)).toBe(kidPlaces.corner);
    expect(backTarget(kidPlaces.store)).toBe(kidPlaces.corner);
  });
});
