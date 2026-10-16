export const ANIMALS = [
  { id: "lapin", fr: "lapin", en: "rabbit", emoji: "🐰" },
  { id: "chat", fr: "chat", en: "cat", emoji: "🐱" },
  { id: "oiseau", fr: "oiseau", en: "bird", emoji: "🐦" },
  { id: "poisson", fr: "poisson", en: "fish", emoji: "🐟" },
  { id: "canard", fr: "canard", en: "duck", emoji: "🦆" },
  { id: "grenouille", fr: "grenouille", en: "frog", emoji: "🐸" },
] as const;

export type AnimalId = (typeof ANIMALS)[number]["id"];

export function animalById(id: string) {
  return ANIMALS.find((animal) => animal.id === id) ?? null;
}

export function safariAt(index: number) {
  const answer = ANIMALS[index % ANIMALS.length].id;
  const choices = [0, 2, 4]
    .map((offset) => ANIMALS[(index + offset) % ANIMALS.length].id)
    .sort((a, b) => ((a.charCodeAt(0) + index) % 5) - ((b.charCodeAt(0) + index) % 5) || a.localeCompare(b));
  return { answer, choices };
}

export function gradeSafari(picks: string[]) {
  if (picks.length !== 5) return { correct: 0, stars: 0 };
  const correct = picks.filter((pick, index) => pick === safariAt(index).answer).length;
  return { correct, stars: correct === 5 ? 2 : 0 };
}
