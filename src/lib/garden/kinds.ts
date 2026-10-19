export const GARDEN = [
  { id: "flower", emoji: "🌸", fr: "fleur", en: "flower" },
  { id: "tree", emoji: "🌳", fr: "arbre", en: "tree" },
  { id: "bee", emoji: "🐝", fr: "abeille", en: "bee" },
  { id: "house", emoji: "🏠", fr: "maison", en: "house" },
  { id: "sunflower", emoji: "🌻", fr: "tournesol", en: "sunflower" },
  { id: "fountain", emoji: "⛲", fr: "fontaine", en: "fountain" },
  { id: "butterfly", emoji: "🦋", fr: "papillon", en: "butterfly" },
  { id: "bakery", emoji: "🥐", fr: "boulangerie", en: "bakery" },
  { id: "mushroom", emoji: "🍄", fr: "champignon", en: "mushroom" },
  { id: "carousel", emoji: "🎠", fr: "carrousel", en: "carousel" },
  { id: "rainbow", emoji: "🌈", fr: "arc-en-ciel", en: "rainbow" },
  { id: "castle", emoji: "🏰", fr: "château", en: "castle" },
] as const;

export type GardenKind = (typeof GARDEN)[number]["id"];

export function gardenKind(id: string) {
  return GARDEN.find((item) => item.id === id) ?? null;
}

export function buildingShopOn(settings: unknown) {
  return (settings as { building_shop?: boolean } | null)?.building_shop === true;
}

export function gardenTheme(fullAt: string | null, now: Date) {
  if (!fullAt) return "day";
  const planted = new Date(fullAt);
  if (Number.isNaN(planted.getTime())) return "day";
  const later = now.getFullYear() * 12 + now.getMonth() > planted.getFullYear() * 12 + planted.getMonth();
  return later ? "night" : "day";
}
