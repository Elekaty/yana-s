export const phrases = {
  greetMorning: { fr: "Bonjour {name} !", en: "Good morning, {name}!" },
  greetDay: { fr: "Coucou {name} !", en: "Hello, {name}!" },
  greetNight: { fr: "Bonne nuit, {name}.", en: "Good night, {name}." },
  purr: { fr: "Ronron…", en: "Purr…" },
  nap: { fr: "Je fais dodo.", en: "I am napping." },
  cheer: { fr: "Bravo {name} !", en: "Well done, {name}!" },
  think: { fr: "Je réfléchis.", en: "I am thinking." },
  yarn: { fr: "Ma pelote !", en: "My yarn!" },
  bubble: { fr: "Coucou, ami !", en: "Hello, friend!" },
  dance: { fr: "Dansons !", en: "Let's dance!" },
  breakTime: { fr: "C'est la pause !", en: "Break time!" },
  reminder: { fr: "Mochi a quelque chose pour {name}.", en: "Mochi has something for {name}." },
  voiceLiked: { fr: "Quelqu'un a aimé ta voix.", en: "Someone liked your voice." },
} as const;

export type PhraseId = keyof typeof phrases;

export function fillPhrase(template: string, name: string) {
  return template.replaceAll("{name}", name || "toi");
}

export function greetPhrase(lang: "fr" | "en", name: string, hour: number) {
  const id = hour < 12 ? "greetMorning" : hour < 18 ? "greetDay" : "greetNight";
  return fillPhrase(phrases[id][lang], name);
}
