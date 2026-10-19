import { BUBBLE_FRIENDS, type BubbleFriend } from "@/lib/mochi";

export const STARTER_FRIEND: BubbleFriend = "bunny";

export function crewWithStarter(unlocked: readonly string[]) {
  const met = new Set(unlocked);
  met.add(STARTER_FRIEND);
  return BUBBLE_FRIENDS.filter((friend) => met.has(friend));
}
