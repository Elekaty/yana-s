export const DICTIONARY_TAGS = ["animals", "food", "math_addition", "logic"] as const;

export type DictionaryTag = (typeof DICTIONARY_TAGS)[number];

export type DictionaryEntry = {
  id: string;
  tag: DictionaryTag;
  emoji: string;
  fr: string;
  en: string;
  frPlural?: string;
  enPlural?: string;
  article?: "un" | "une";
  answer?: string;
};

export const DICTIONARY: DictionaryEntry[] = [
  { id: "lapin", tag: "animals", emoji: "🐰", fr: "lapin", en: "rabbit", frPlural: "lapins", enPlural: "rabbits", article: "un" },
  { id: "chat", tag: "animals", emoji: "🐱", fr: "chat", en: "cat", frPlural: "chats", enPlural: "cats", article: "un" },
  { id: "oiseau", tag: "animals", emoji: "🐦", fr: "oiseau", en: "bird", frPlural: "oiseaux", enPlural: "birds", article: "un" },
  { id: "poisson", tag: "animals", emoji: "🐟", fr: "poisson", en: "fish", frPlural: "poissons", enPlural: "fish", article: "un" },
  { id: "canard", tag: "animals", emoji: "🦆", fr: "canard", en: "duck", frPlural: "canards", enPlural: "ducks", article: "un" },
  { id: "grenouille", tag: "animals", emoji: "🐸", fr: "grenouille", en: "frog", frPlural: "grenouilles", enPlural: "frogs", article: "une" },
  { id: "chien", tag: "animals", emoji: "🐶", fr: "chien", en: "dog", frPlural: "chiens", enPlural: "dogs", article: "un" },
  { id: "renard", tag: "animals", emoji: "🦊", fr: "renard", en: "fox", frPlural: "renards", enPlural: "foxes", article: "un" },
  { id: "panda", tag: "animals", emoji: "🐼", fr: "panda", en: "panda", frPlural: "pandas", enPlural: "pandas", article: "un" },
  { id: "hamster", tag: "animals", emoji: "🐹", fr: "hamster", en: "hamster", frPlural: "hamsters", enPlural: "hamsters", article: "un" },
  { id: "cheval", tag: "animals", emoji: "🐴", fr: "cheval", en: "horse", frPlural: "chevaux", enPlural: "horses", article: "un" },
  { id: "vache", tag: "animals", emoji: "🐮", fr: "vache", en: "cow", frPlural: "vaches", enPlural: "cows", article: "une" },
  { id: "elephant", tag: "animals", emoji: "🐘", fr: "éléphant", en: "elephant", frPlural: "éléphants", enPlural: "elephants", article: "un" },

  { id: "pomme", tag: "food", emoji: "🍎", fr: "pomme", en: "apple", frPlural: "pommes", enPlural: "apples", article: "une" },
  { id: "biscuit", tag: "food", emoji: "🍪", fr: "biscuit", en: "biscuit", frPlural: "biscuits", enPlural: "biscuits", article: "un" },
  { id: "jus", tag: "food", emoji: "🧃", fr: "jus", en: "juice", frPlural: "jus", enPlural: "juices", article: "un" },
  { id: "fraise", tag: "food", emoji: "🍓", fr: "fraise", en: "strawberry", frPlural: "fraises", enPlural: "strawberries", article: "une" },
  { id: "carotte", tag: "food", emoji: "🥕", fr: "carotte", en: "carrot", frPlural: "carottes", enPlural: "carrots", article: "une" },
  { id: "gateau", tag: "food", emoji: "🍰", fr: "gâteau", en: "cake", frPlural: "gâteaux", enPlural: "cakes", article: "un" },

  { id: "add-2-3", tag: "math_addition", emoji: "➕", fr: "Combien font 2 et 3 ?", en: "What is 2 plus 3?", answer: "5" },
  { id: "add-4-1", tag: "math_addition", emoji: "➕", fr: "Combien font 4 et 1 ?", en: "What is 4 plus 1?", answer: "5" },
  { id: "add-5-5", tag: "math_addition", emoji: "➕", fr: "Combien font 5 et 5 ?", en: "What is 5 plus 5?", answer: "10" },
  { id: "add-6-2", tag: "math_addition", emoji: "➕", fr: "Combien font 6 et 2 ?", en: "What is 6 plus 2?", answer: "8" },
  { id: "add-7-3", tag: "math_addition", emoji: "➕", fr: "Combien font 7 et 3 ?", en: "What is 7 plus 3?", answer: "10" },
  { id: "add-8-4", tag: "math_addition", emoji: "➕", fr: "Combien font 8 et 4 ?", en: "What is 8 plus 4?", answer: "12" },
  { id: "add-9-1", tag: "math_addition", emoji: "➕", fr: "Combien font 9 et 1 ?", en: "What is 9 plus 1?", answer: "10" },
  { id: "add-10-6", tag: "math_addition", emoji: "➕", fr: "Combien font 10 et 6 ?", en: "What is 10 plus 6?", answer: "16" },

  { id: "logic-more", tag: "logic", emoji: "🍎", fr: "Qu'est-ce qui est le plus : 3 pommes ou 5 pommes ?", en: "Which is more: 3 apples or 5 apples?", answer: "5 pommes" },
  { id: "logic-first", tag: "logic", emoji: "📅", fr: "Qu'est-ce qui vient d'abord : lundi ou mardi ?", en: "What comes first: Monday or Tuesday?", answer: "lundi" },
  { id: "logic-odd", tag: "logic", emoji: "🐱", fr: "Quel mot n'est pas un animal : chat, lune, chien ?", en: "Which word is not an animal: cat, moon, dog?", answer: "lune" },
  { id: "logic-pair", tag: "logic", emoji: "🧦", fr: "Deux chaussettes font une paire. Combien de paires font 4 chaussettes ?", en: "Two socks make a pair. How many pairs are 4 socks?", answer: "2" },
];

const wordTags = new Set<DictionaryTag>(["animals", "food"]);

export function entriesFor(tags?: string[]) {
  const known = (tags ?? []).filter((tag) => DICTIONARY.some((entry) => entry.tag === tag || entry.id === tag));
  if (known.length === 0) return DICTIONARY.filter((entry) => wordTags.has(entry.tag));
  const found = DICTIONARY.filter((entry) => known.includes(entry.tag) || known.includes(entry.id));
  return found.length > 0 ? found : DICTIONARY.filter((entry) => wordTags.has(entry.tag));
}

export function animalsFor(tags?: string[]) {
  const animals = DICTIONARY.filter((entry) => entry.tag === "animals");
  if (!tags?.length) return animals;
  const vocab = DICTIONARY.filter((entry) => wordTags.has(entry.tag) && (tags.includes(entry.tag) || tags.includes(entry.id)));
  return vocab.length >= 3 ? vocab : animals;
}

export function kitchenFoods(tags?: string[]) {
  const foods = DICTIONARY.filter((entry) => entry.tag === "food");
  const fallback = foods.slice(0, 3);
  if (!tags?.length) return fallback;
  const matched = foods.filter((entry) => tags.includes(entry.tag) || tags.includes(entry.id));
  if (matched.length === 0) return fallback;
  if (matched.length >= 3) return matched.slice(0, 3);
  const extra = fallback.filter((entry) => !matched.some((item) => item.id === entry.id));
  return [...matched, ...extra].slice(0, 3);
}

export function wordById(id: string) {
  return DICTIONARY.find((entry) => entry.id === id) ?? null;
}

export function countPhrase(entry: DictionaryEntry, count: number, lang: "fr" | "en") {
  const amount = Math.min(3, Math.max(1, Math.floor(count)));
  if (lang === "en") {
    const word = amount > 1 ? entry.enPlural || entry.en : entry.en;
    return `${["one", "two", "three"][amount - 1]} ${word}`;
  }
  if (amount === 1) return `${entry.article === "une" ? "une" : "un"} ${entry.fr}`;
  return `${["deux", "trois"][amount - 2]} ${entry.frPlural || entry.fr}`;
}
