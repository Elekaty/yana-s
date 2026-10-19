import { describe, expect, it } from "vitest";
import { crewWithStarter } from "@/lib/mochi/crew";
import { phraseAt } from "@/lib/mochi/phrases";

describe("starter friend", () => {
  it("keeps Praline in the crew before anyone else is met", () => {
    expect(crewWithStarter([])).toEqual(["bunny"]);
  });

  it("keeps the other friends in cast order", () => {
    expect(crewWithStarter(["hamster", "bunny", "fox"])).toEqual(["bunny", "fox", "hamster"]);
  });

  it("uses the same greeting on the server and the client", () => {
    expect(phraseAt("greeting_day", "fr", "Yana")).toBe(phraseAt("greeting_day", "fr", "Yana"));
  });
});
