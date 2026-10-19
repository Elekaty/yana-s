export const kidPlaces = {
  home: "/kid/home",
  words: "/kid/words",
  talk: "/kid/games/voice",
  animals: "/kid/games/bay/safari",
  stories: "/kid/games/stories",
  corner: "/kid/corner",
  friends: "/kid/games/friends",
  garden: "/kid/garden",
  town: "/kid/town",
  store: "/kid/store",
  games: "/kid/games",
  bay: "/kid/games/bay",
  lagoon: "/kid/games/lagoon",
  cove: "/kid/games/cove",
  bulles: "/kid/games/bay/bulles",
  fruit: "/kid/games/bay/fruit",
  kitchen: "/kid/games/bay/kitchen",
} as const;

export const gameIslands = [kidPlaces.bay, kidPlaces.lagoon, kidPlaces.cove] as const;

export const bayCards = [kidPlaces.bulles, kidPlaces.fruit, kidPlaces.kitchen] as const;

export function backTarget(path: string) {
  if (path === kidPlaces.words || path === kidPlaces.corner) return kidPlaces.home;
  if (path === kidPlaces.talk) return kidPlaces.words;
  if (path.startsWith(`${kidPlaces.talk}/`)) return kidPlaces.talk;
  if (path === kidPlaces.animals || path.startsWith(`${kidPlaces.animals}/`)) return kidPlaces.words;
  if (path === kidPlaces.stories) return kidPlaces.words;
  if (path.startsWith(`${kidPlaces.stories}/`)) return kidPlaces.stories;
  if (path === kidPlaces.town) return kidPlaces.garden;
  if (path === kidPlaces.friends || path === kidPlaces.garden || path === kidPlaces.store) return kidPlaces.corner;
  if (path === kidPlaces.bay) return kidPlaces.games;
  if (path.startsWith("/kid/games/bay/")) return kidPlaces.bay;
  if (path === "/kid/games/cove") return kidPlaces.games;
  return null;
}
