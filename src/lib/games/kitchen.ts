export const FOODS = ["pomme", "biscuit", "jus"] as const;
export type Food = (typeof FOODS)[number];
export type Plate = Record<Food, number>;
export type OrderLine = { item: Food; count: number };

const FR = {
  pomme: ["une pomme", "deux pommes", "trois pommes"],
  biscuit: ["un biscuit", "deux biscuits", "trois biscuits"],
  jus: ["un jus", "deux jus", "trois jus"],
} as const;

const EN = {
  pomme: ["one apple", "two apples", "three apples"],
  biscuit: ["one biscuit", "two biscuits", "three biscuits"],
  jus: ["one juice", "two juices", "three juices"],
} as const;

export function emptyPlate(): Plate {
  return { pomme: 0, biscuit: 0, jus: 0 };
}

export function orderAt(index: number): OrderLine[] {
  const first = FOODS[index % FOODS.length];
  const firstCount = (index % 3) + 1;
  if (index < 2) return [{ item: first, count: firstCount }];
  const second = FOODS[(index + 1) % FOODS.length];
  return [
    { item: first, count: firstCount },
    { item: second, count: (index % 2) + 1 },
  ];
}

export function orderText(order: OrderLine[], lang: "fr" | "en") {
  const words = lang === "en" ? EN : FR;
  return order.map((line) => words[line.item][line.count - 1]).join(lang === "en" ? " and " : " et ");
}

export function plateMatches(order: OrderLine[], plate: Plate) {
  return FOODS.every((food) => {
    const wanted = order.find((line) => line.item === food)?.count ?? 0;
    return plate[food] === wanted;
  });
}

export function gradeKitchen(plates: Plate[]) {
  if (plates.length !== 5) return { correct: 0, stars: 0 };
  const correct = plates.filter((plate, index) => plateMatches(orderAt(index), plate)).length;
  return { correct, stars: correct === 5 ? 2 : 0 };
}
