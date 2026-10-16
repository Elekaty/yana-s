import { animalsFor, wordById } from "@/lib/dictionary";

export function animalById(id: string) {
  return wordById(id);
}

export function safariAt(index: number, tags?: string[]) {
  const pool = animalsFor(tags);
  const answer = pool[index % pool.length]?.id ?? "";
  const choices = [0, 2, 4]
    .map((offset) => pool[(index + offset) % pool.length]?.id ?? "")
    .filter((id, slot, list) => id && list.indexOf(id) === slot)
    .sort((a, b) => ((a.charCodeAt(0) + index) % 5) - ((b.charCodeAt(0) + index) % 5) || a.localeCompare(b));
  return { answer, choices };
}

export function gradeSafari(picks: string[], tags?: string[]) {
  if (picks.length !== 5) return { correct: 0, stars: 0 };
  const correct = picks.filter((pick, index) => pick === safariAt(index, tags).answer).length;
  return { correct, stars: correct === 5 ? 2 : 0 };
}
