export const DEFAULT_TABLES = [2, 5, 10] as const;

export const FRUIT_LEVELS = {
  easy: { fruits: 3, gravity: 360, launch: 400, stagger: 0.5 },
  medium: { fruits: 4, gravity: 520, launch: 480, stagger: 0.3 },
} as const;

export type FruitLevel = keyof typeof FRUIT_LEVELS;

export type TimesQuestion = {
  left: number;
  right: number;
  answer: number;
  choices: number[];
};

export function tablesFrom(settings: unknown) {
  const raw = (settings as { tables?: unknown } | null)?.tables;
  if (!Array.isArray(raw)) return [...DEFAULT_TABLES];
  const tables = raw.map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 10);
  return tables.length > 0 ? tables.slice(0, 6) : [...DEFAULT_TABLES];
}

export function questionAt(tables: number[], index: number, choiceCount: number): TimesQuestion {
  const safe = tables.length > 0 ? tables : [...DEFAULT_TABLES];
  const left = safe[index % safe.length];
  const right = (index % 10) + 1;
  const answer = left * right;
  return { left, right, answer, choices: choicesFor(answer, choiceCount, index) };
}

export function gradeRound(tables: number[], picks: number[], choiceCount: number) {
  if (picks.length !== 5) return { correct: 0, stars: 0 };
  const correct = picks.filter((pick, index) => pick === questionAt(tables, index, choiceCount).answer).length;
  return { correct, stars: correct === 5 ? 2 : 0 };
}

function choicesFor(answer: number, count: number, salt: number) {
  const size = count === 4 ? 4 : 3;
  const wrong: number[] = [];
  let step = 1;
  while (wrong.length < size - 1) {
    const candidate = answer + ((salt + step * 3) % 7) + 1;
    if (candidate !== answer && !wrong.includes(candidate)) wrong.push(candidate);
    step += 1;
  }
  const choices = [answer, ...wrong];
  return choices.sort((a, b) => ((a + salt) % 5) - ((b + salt) % 5) || a - b);
}
