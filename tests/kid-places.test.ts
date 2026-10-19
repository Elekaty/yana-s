import { describe, expect, it } from "vitest";
import { backTarget, bayCards, gameIslands, kidPlaces } from "@/lib/kid/places";

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

  it("keeps play to three islands and the beach to three cards", () => {
    expect(gameIslands).toEqual(["/kid/games/bay", "/kid/games/lagoon", "/kid/games/cove"]);
    expect(bayCards).toEqual(["/kid/games/bay/bulles", "/kid/games/bay/fruit", "/kid/games/bay/kitchen"]);
  });

  it("sends a beach game back to the beach, and the beach back to play", () => {
    expect(backTarget("/kid/games/bay")).toBe("/kid/games");
    expect(backTarget("/kid/games/bay/kitchen")).toBe("/kid/games/bay");
    expect(backTarget("/kid/games/bay/safari")).toBe("/kid/words");
  });

  it("sends friends, the garden, and the shop back to Corner", () => {
    expect(backTarget(kidPlaces.friends)).toBe(kidPlaces.corner);
    expect(backTarget(kidPlaces.garden)).toBe(kidPlaces.corner);
    expect(backTarget(kidPlaces.store)).toBe(kidPlaces.corner);
    expect(backTarget(kidPlaces.town)).toBe(kidPlaces.garden);
  });
});
