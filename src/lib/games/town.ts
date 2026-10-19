export const TOWN_ITEMS = [
  { id: "flowers", fr: "fleurs", en: "flowers", cost: 1 },
  { id: "tree", fr: "arbre", en: "tree", cost: 2 },
  { id: "house", fr: "maison", en: "house", cost: 5 },
  { id: "fountain", fr: "fontaine", en: "fountain", cost: 6 },
  { id: "school", fr: "école", en: "school", cost: 8 },
  { id: "bakery", fr: "boulangerie", en: "bakery", cost: 8 },
  { id: "carousel", fr: "manège", en: "carousel", cost: 12 },
  { id: "castle", fr: "château", en: "castle", cost: 20 },
] as const;

export type TownItemId = (typeof TOWN_ITEMS)[number]["id"];

export function townItem(id: string) {
  return TOWN_ITEMS.find((item) => item.id === id) ?? null;
}

export type TownRefusal = "bad" | "filled" | "cap" | "stars" | "closed";

export function townPurchase(input: {
  balance: number;
  spent: number;
  cap: number | null;
  slotTaken: boolean;
  itemId: string;
  shopOpen: boolean;
}): { ok: true; balance: number } | { ok: false; reason: TownRefusal } {
  if (!input.shopOpen) return { ok: false, reason: "closed" };
  const item = townItem(input.itemId);
  if (!item) return { ok: false, reason: "bad" };
  if (input.slotTaken) return { ok: false, reason: "filled" };
  if (input.cap !== null && input.spent + item.cost > input.cap) return { ok: false, reason: "cap" };
  if (input.balance < item.cost) return { ok: false, reason: "stars" };
  return { ok: true, balance: input.balance - item.cost };
}

export function townSpent(items: readonly string[]) {
  return items.reduce((sum, id) => sum + (townItem(id)?.cost ?? 0), 0);
}

export function townFull(count: number) {
  return count >= 12;
}

export function townRefusal(message: string): TownRefusal {
  if (message.includes("town cap")) return "cap";
  if (message.includes("not enough")) return "stars";
  if (message.includes("filled")) return "filled";
  return "bad";
}
