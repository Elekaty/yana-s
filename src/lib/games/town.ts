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
