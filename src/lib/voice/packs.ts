export type Phrase = { id: string; fr: string; en: string };

export const PACKS = {
  words: [
    { id: "word-chat", fr: "chat", en: "cat" },
    { id: "word-lune", fr: "lune", en: "moon" },
    { id: "word-arbre", fr: "arbre", en: "tree" },
    { id: "word-livre", fr: "livre", en: "book" },
    { id: "word-fleur", fr: "fleur", en: "flower" },
  ],
  sentences: [
    { id: "sentence-jardin", fr: "Le chat dort dans le jardin.", en: "The cat sleeps in the garden." },
    { id: "sentence-lune", fr: "La lune est douce ce soir.", en: "The moon is soft tonight." },
    { id: "sentence-ami", fr: "Mon ami lit un livre.", en: "My friend is reading a book." },
  ],
  twisters: [
    { id: "twister-tortues", fr: "Trois tortues trottaient sur un trottoir.", en: "Three turtles trotted on a pavement." },
    { id: "twister-chasseur", fr: "Un chasseur sachant chasser.", en: "A hunter who knows how to hunt." },
    { id: "twister-chaussettes", fr: "Les chaussettes de l'archiduchesse.", en: "The archduchess's socks." },
  ],
} as const;

export const NEW_PROMPTS = [
  { id: "new-chat", fr: "Qu'est-ce que ton chat aime ?", starter: "Mon chat aime" },
  { id: "new-jour", fr: "Comment est ta journée ?", starter: "Aujourd'hui je" },
  { id: "new-ami", fr: "Que fait ton ami ?", starter: "Mon ami" },
] as const;

export const RUNGS = ["listen", "whisper", "say", "mochi", "record"] as const;

export function allPhrases(): Phrase[] {
  return [...PACKS.words, ...PACKS.sentences, ...PACKS.twisters];
}

export function phraseById(id: string) {
  return allPhrases().find((phrase) => phrase.id === id) ?? null;
}

export function newPromptFor(dayIndex: number) {
  return NEW_PROMPTS[Math.abs(dayIndex) % NEW_PROMPTS.length];
}

export function promptForToday(now = Date.now()) {
  const day = Math.floor((now - Date.UTC(new Date(now).getUTCFullYear(), 0, 0)) / 86_400_000);
  return newPromptFor(day);
}
