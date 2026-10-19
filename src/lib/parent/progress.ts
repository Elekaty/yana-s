export function suggestedNext(levels: { key: string; level: number }[]) {
  return levels.filter((row) => row.level < 1).slice(0, 3).map((row) => row.key);
}

export function playDropped(thisWeek: number, lastWeek: number) {
  if (lastWeek < 3) return false;
  return thisWeek * 3 <= lastWeek * 2;
}

export function scanUsage(cached: boolean[]) {
  const cache = cached.filter(Boolean).length;
  return { cache, ai: cached.length - cache };
}

export function weeklyDigest(input: {
  childName: string;
  homework: number;
  games: number;
  logic: number;
  voice: number;
  stories: number;
  stars: number;
  hints: number;
  strong: number;
  practicing: number;
}) {
  const name = input.childName || "Yana";
  return `${name} this week: ${input.homework} homework, ${input.games} games, ${input.logic} logic, ${input.voice} voice, ${input.stories} stories. ${input.stars} stars earned. ${input.hints} hints used. ${input.strong} strong, ${input.practicing} practicing.`;
}
