import { describe, expect, it } from "vitest";
import { heldName, kidLine, kidLinePaths } from "@/lib/kid/lines";

describe("kid screen lines", () => {
  it("has a French line and an English line for every kid screen", () => {
    for (const path of kidLinePaths) {
      const fr = kidLine(path, "fr", "Yana");
      const en = kidLine(path, "en", "Yana");
      expect(fr.length).toBeGreaterThan(0);
      expect(en.length).toBeGreaterThan(0);
      expect(fr).not.toBe(en);
    }
    expect(kidLine("/kid/games/stories/chat-lune", "fr", "Yana")).toBe("Écoute l'histoire.");
    expect(kidLine("/kid/games/stories/chat-lune", "en", "Yana")).toBe("Listen to the story.");
  });

  it("greets her by name at home", () => {
    expect(kidLine("/kid/home", "fr", "Yana")).toBe("Bonjour Yana !");
    expect(kidLine("/kid/home", "en", "Yana")).toBe("Hello Yana!");
  });

  it("reads a button name from its label", () => {
    expect(heldName("Retour", "‹")).toBe("Retour");
    expect(heldName(null, "  Plage  ")).toBe("Plage");
  });
});
