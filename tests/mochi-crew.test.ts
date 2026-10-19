import { describe, expect, it } from "vitest";
import { crewWithStarter } from "@/lib/mochi/crew";
import { friendCards } from "@/lib/mochi/friends";
import { phraseAt } from "@/lib/mochi/phrases";

describe("starter friend", () => {
  it("keeps Praline in the crew before anyone else is met", () => {
    expect(crewWithStarter([])).toEqual(["bunny"]);
  });

  it("keeps the other friends in cast order", () => {
    expect(crewWithStarter(["hamster", "bunny", "fox"])).toEqual(["bunny", "fox", "hamster"]);
  });

  it("shows six characters and hides a friend until they meet", () => {
    const fresh = friendCards([], "fr");
    expect(fresh.map((card) => card.name)).toEqual(["Mochi", "Praline", "", "", "", ""]);
    expect(fresh.filter((card) => card.locked)).toHaveLength(4);
    expect(fresh[0]?.line).toBe("Un gros chat blanc. Il aime la sieste.");
    expect(fresh[1]?.line).toBe("Une lapine qui saute.");
    const met = friendCards(["fox"], "en");
    expect(met.find((card) => card.id === "fox")).toMatchObject({ name: "Roux", line: "A fox who finds things.", locked: false });
    expect(met.find((card) => card.id === "hamster")?.name).toBe("");
  });

  it("uses the same greeting on the server and the client", () => {
    expect(phraseAt("greeting_day", "fr", "Yana")).toBe(phraseAt("greeting_day", "fr", "Yana"));
  });
});
