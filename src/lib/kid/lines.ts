const lines = [
  { prefix: "/kid/home", fr: "Bonjour {name} !", en: "Hello {name}!" },
  { prefix: "/kid/homework", fr: "Fais ton devoir.", en: "Do your homework." },
  { prefix: "/kid/words", fr: "Choisis les mots.", en: "Choose the words." },
  { prefix: "/kid/corner", fr: "Voici ton coin.", en: "Here is your corner." },
  { prefix: "/kid/garden", fr: "Touche une plante.", en: "Tap a plant." },
  { prefix: "/kid/store", fr: "Demande un prix.", en: "Ask for a prize." },
  { prefix: "/kid/town", fr: "Choisis un bâtiment.", en: "Choose a building." },
  { prefix: "/kid/games/bay/bulles", fr: "Éclate la bonne bulle.", en: "Pop the right bubble." },
  { prefix: "/kid/games/bay/fruit", fr: "Coupe le fruit.", en: "Slice the fruit." },
  { prefix: "/kid/games/bay/kitchen", fr: "Remplis l'assiette.", en: "Fill the plate." },
  { prefix: "/kid/games/bay/safari", fr: "Trouve l'animal.", en: "Find the animal." },
  { prefix: "/kid/games/bay", fr: "Choisis un jeu.", en: "Choose a game." },
  { prefix: "/kid/games/lagoon", fr: "Suis les flèches.", en: "Follow the arrows." },
  { prefix: "/kid/games/cove/draw", fr: "Dessine.", en: "Draw." },
  { prefix: "/kid/games/cove/music", fr: "Joue la chanson.", en: "Play the song." },
  { prefix: "/kid/games/cove", fr: "Dessine ou joue.", en: "Draw or play." },
  { prefix: "/kid/games/voice/practice", fr: "Dis la phrase.", en: "Say the phrase." },
  { prefix: "/kid/games/voice/new", fr: "Raconte ta journée.", en: "Tell about your day." },
  { prefix: "/kid/games/voice/album", fr: "Écoute tes mots.", en: "Hear your words." },
  { prefix: "/kid/games/voice", fr: "Parle.", en: "Talk." },
  { prefix: "/kid/games/stories", fr: "Choisis une histoire.", en: "Pick a story." },
  { prefix: "/kid/games/friends", fr: "Voici tes amis.", en: "Here are your friends." },
  { prefix: "/kid/games", fr: "Choisis une île.", en: "Choose an island." },
] as const;

const ordered = [...lines].sort((a, b) => b.prefix.length - a.prefix.length);

export const kidLinePaths = lines.map((item) => item.prefix);

export function kidLine(path: string, lang: "fr" | "en", name: string) {
  const who = name || (lang === "fr" ? "toi" : "you");
  if (path.startsWith("/kid/games/stories/") && path !== "/kid/games/stories") {
    return lang === "en" ? "Listen to the story." : "Écoute l'histoire.";
  }
  const row = ordered.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
  const text = row ? row[lang] : lang === "en" ? "Tap a button." : "Touche un bouton.";
  return text.replaceAll("{name}", who);
}

export function heldName(aria: string | null, text: string) {
  return (aria || text).replace(/\s+/g, " ").trim();
}
