import { describe, expect, it } from "vitest";
import { FRUIT_LEVELS, gradeRound, questionAt, tablesFrom } from "@/lib/games/questions";

describe("times questions", () => {
  it("uses tables 2, 5 and 10 unless the child has others", () => {
    expect(tablesFrom(null)).toEqual([2, 5, 10]);
    expect(tablesFrom({ tables: [3, 4] })).toEqual([3, 4]);
  });

  it("computes the product and keeps the right answer among the choices", () => {
    const easy = questionAt([2, 5, 10], 4, 3);
    expect(easy.left * easy.right).toBe(easy.answer);
    expect(easy.choices).toHaveLength(3);
    expect(easy.choices).toContain(easy.answer);
    expect(questionAt([2], 0, 4).choices).toHaveLength(4);
  });

  it("awards 2 stars only when all 5 answers are the computed products", () => {
    const tables = [2, 5, 10];
    const picks = [0, 1, 2, 3, 4].map((index) => questionAt(tables, index, 3).answer);
    expect(gradeRound(tables, picks, 3)).toEqual({ correct: 5, stars: 2 });
    picks[2] = 1;
    expect(gradeRound(tables, picks, 3).stars).toBe(0);
  });

  it("keeps the Fruit Slash speeds from the plan", () => {
    expect(FRUIT_LEVELS.easy).toMatchObject({ fruits: 3, gravity: 360, launch: 400, stagger: 0.5 });
    expect(FRUIT_LEVELS.medium).toMatchObject({ fruits: 4, gravity: 520, launch: 480, stagger: 0.3 });
  });
});
