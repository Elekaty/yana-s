export type Lang = "fr" | "en";

const dictionary = {
  fr: {
    hello: "Bonjour",
    home: "Accueil",
    homework: "Devoirs",
    games: "Jeux",
    store: "Boutique",
    parents: "Parents",
    homeBody: "Mochi est dans le salon. Tes jeux et tes devoirs arrivent bientôt.",
    seeMochi: "Voir Mochi",
    homeworkBody: "Tes devoirs arriveront ici.",
    gamesBody: "Les jeux arrivent bientôt.",
    storeBody: "La boutique arrive bientôt.",
  },
  en: {
    hello: "Hello",
    home: "Home",
    homework: "Homework",
    games: "Games",
    store: "Store",
    parents: "Parents",
    homeBody: "Mochi is in the living room. Games and homework are on their way.",
    seeMochi: "See Mochi",
    homeworkBody: "Homework will show up here.",
    gamesBody: "Games are on their way.",
    storeBody: "The shop is on its way.",
  },
} as const;

export function t(lang: Lang | null | undefined) {
  return dictionary[lang === "en" ? "en" : "fr"];
}

export type Copy = ReturnType<typeof t>;

export const dictionaryKeys = Object.keys(dictionary.fr);
