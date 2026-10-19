export const PHRASE_KEYS = [
  "first_try_correct",
  "correct_after_hint",
  "retry_after_mistake",
  "finished_hard_level",
  "came_back_after_break",
  "finished_homework",
  "recorded_voice",
  "streak_return",
  "greeting_morning",
  "greeting_day",
  "greeting_evening",
  "bedtime",
  "purr",
  "nap",
  "yarn",
  "cheer",
  "story",
  "fish",
  "clock",
] as const;

export type PhraseKey = (typeof PHRASE_KEYS)[number];

const lines: Record<PhraseKey, { fr: [string, string, string]; en: [string, string, string] }> = {
  first_try_correct: {
    fr: ["Du premier coup, {name} !", "Sans indice, bravo {name} !", "Tu l'as trouvé tout de suite, {name} !"],
    en: ["First try, {name}!", "No hint needed, {name}!", "You found it straight away, {name}!"],
  },
  correct_after_hint: {
    fr: ["Bravo, tu as utilisé l'indice, {name} !", "L'indice t'a aidée, {name} !", "Tu as regardé l'indice et tu as trouvé, {name} !"],
    en: ["You used the hint, {name}!", "The hint helped, {name}!", "You looked at the hint and found it, {name}!"],
  },
  retry_after_mistake: {
    fr: ["Tu as réessayé, {name} !", "Encore un essai, et c'est bon, {name} !", "Tu n'as pas lâché, {name} !"],
    en: ["You tried again, {name}!", "Another try, and you got it, {name}!", "You kept going, {name}!"],
  },
  finished_hard_level: {
    fr: ["Ce niveau était dur, {name} !", "Tu as fini un niveau difficile, {name} !", "Quel niveau, {name} !"],
    en: ["That level was hard, {name}!", "You finished a hard level, {name}!", "What a level, {name}!"],
  },
  came_back_after_break: {
    fr: ["Te revoilà, {name} !", "La pause est finie, {name} !", "On reprend, {name} !"],
    en: ["You are back, {name}!", "The break is over, {name}!", "Let's go on, {name}!"],
  },
  finished_homework: {
    fr: ["Les devoirs sont finis, {name} !", "Tu as terminé la page, {name} !", "C'est fait, {name} !"],
    en: ["Homework is finished, {name}!", "You finished the page, {name}!", "It is done, {name}!"],
  },
  recorded_voice: {
    fr: ["J'ai entendu ta voix, {name} !", "C'est enregistré, {name} !", "Tes parents pourront écouter, {name} !"],
    en: ["I heard your voice, {name}!", "It is recorded, {name}!", "Your parents can listen, {name}!"],
  },
  streak_return: {
    fr: ["Tu es revenue, {name} !", "Content de te revoir, {name} !", "Encore toi, {name} !"],
    en: ["You came back, {name}!", "Glad to see you, {name}!", "You again, {name}!"],
  },
  greeting_morning: {
    fr: ["Bonjour {name} !", "Bonne journée, {name} !", "Coucou {name}, c'est le matin !"],
    en: ["Good morning, {name}!", "Hello {name}, it is morning!", "Hi {name}!"],
  },
  greeting_day: {
    fr: ["Coucou {name} !", "Te voilà, {name} !", "Salut {name} !"],
    en: ["Hello, {name}!", "There you are, {name}!", "Hi {name}!"],
  },
  greeting_evening: {
    fr: ["Bonsoir {name} !", "C'est le soir, {name}.", "Encore un peu, {name} ?"],
    en: ["Good evening, {name}!", "It is evening, {name}.", "A little longer, {name}?"],
  },
  bedtime: {
    fr: ["Bonne nuit, {name}.", "Je vais dormir, {name}.", "Dodo, {name}."],
    en: ["Good night, {name}.", "I am going to sleep, {name}.", "Sleep time, {name}."],
  },
  purr: {
    fr: ["Ronron…", "Mmm, {name}.", "Je ronronne."],
    en: ["Purr…", "Mmm, {name}.", "I am purring."],
  },
  nap: {
    fr: ["Je fais dodo.", "Une petite sieste.", "Chut, je dors."],
    en: ["I am napping.", "A short nap.", "Shh, I am asleep."],
  },
  yarn: {
    fr: ["Ma pelote !", "Je l'attrape !", "La laine roule !"],
    en: ["My yarn!", "I will catch it!", "The yarn is rolling!"],
  },
  cheer: {
    fr: ["Bravo {name} !", "Oui {name} !", "Super {name} !"],
    en: ["Well done, {name}!", "Yes, {name}!", "Great, {name}!"],
  },
  story: {
    fr: ["Une histoire ?", "On lit ?", "Viens, une histoire."],
    en: ["A story?", "Shall we read?", "Come, a story."],
  },
  fish: {
    fr: ["Blub blub !", "Le poisson fait des bulles.", "Regarde les bulles."],
    en: ["Blub blub!", "The fish is blowing bubbles.", "Look at the bubbles."],
  },
  clock: {
    fr: ["Il est {time}.", "Regarde, {time}.", "L'heure : {time}."],
    en: ["It is {time}.", "Look, {time}.", "The time is {time}."],
  },
};

const lastIndex = new Map<string, number>();

export function phraseAt(key: PhraseKey, lang: "fr" | "en", name: string, index = 0) {
  const set = lines[key][lang];
  return set[index % set.length].replaceAll("{name}", name || (lang === "fr" ? "toi" : "you"));
}

export function pickPhrase(key: PhraseKey, lang: "fr" | "en", name: string, avoid?: number) {
  const set = lines[key][lang];
  const memory = `${key}:${lang}`;
  const skip = avoid ?? lastIndex.get(memory) ?? -1;
  let index = (skip + 1) % set.length;
  if (set.length > 1 && index === skip) index = (index + 1) % set.length;
  lastIndex.set(memory, index);
  const text = set[index].replaceAll("{name}", name || (lang === "fr" ? "toi" : "you"));
  return { text, index };
}

export function clockTime(lang: "fr" | "en", hour: number, minute: number) {
  if (lang === "en") return `${hour}:${String(minute).padStart(2, "0")}`;
  const h = hour % 12 || 12;
  const unit = h > 1 ? "heures" : "heure";
  if (minute === 0) return `${h} ${unit}`;
  return `${h} ${unit} ${minute}`;
}

export function greetingKey(hour: number): PhraseKey {
  if (hour >= 20 || hour < 6) return "bedtime";
  if (hour >= 18) return "greeting_evening";
  if (hour < 12) return "greeting_morning";
  return "greeting_day";
}
