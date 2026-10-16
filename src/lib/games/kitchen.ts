import { countPhrase, kitchenFoods, wordById } from "@/lib/dictionary";

export type Food = string;
export type Plate = Record<string, number>;
export type OrderLine = { item: Food; count: number };

export function emptyPlate(tags?: string[]): Plate {
  const plate: Plate = {};
  for (const food of kitchenFoods(tags)) plate[food.id] = 0;
  return plate;
}

export function orderAt(index: number, tags?: string[]): OrderLine[] {
  const foods = kitchenFoods(tags);
  const first = foods[index % foods.length];
  const firstCount = (index % 3) + 1;
  if (!first) return [];
  if (index < 2) return [{ item: first.id, count: firstCount }];
  const second = foods[(index + 1) % foods.length];
  return [
    { item: first.id, count: firstCount },
    { item: second.id, count: (index % 2) + 1 },
  ];
}

export function orderText(order: OrderLine[], lang: "fr" | "en", tags?: string[]) {
  const foods = kitchenFoods(tags);
  return order
    .map((line) => {
      const food = foods.find((item) => item.id === line.item) ?? wordById(line.item);
      return food ? countPhrase(food, line.count, lang) : String(line.count);
    })
    .join(lang === "en" ? " and " : " et ");
}

export function plateMatches(order: OrderLine[], plate: Plate, tags?: string[]) {
  return kitchenFoods(tags).every((food) => {
    const wanted = order.find((line) => line.item === food.id)?.count ?? 0;
    return (plate[food.id] ?? 0) === wanted;
  });
}

export function gradeKitchen(plates: Plate[], tags?: string[]) {
  if (plates.length !== 5) return { correct: 0, stars: 0 };
  const correct = plates.filter((plate, index) => plateMatches(orderAt(index, tags), plate, tags)).length;
  return { correct, stars: correct === 5 ? 2 : 0 };
}
