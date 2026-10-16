export const GAME_TYPES = ["flashcard", "logic", "physical", "say_aloud", "write"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export function gameTypeFor(taskType: string): GameType {
  if (taskType === "physical_action") return "physical";
  if (taskType === "say_aloud" || taskType === "write" || taskType === "logic") return taskType;
  return "flashcard";
}
