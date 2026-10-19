import { BUBBLE_FRIENDS, type BubbleFriend } from "@/lib/mochi";
import { crewWithStarter } from "@/lib/mochi/crew";

export const FRIEND_CAST: Record<BubbleFriend, { name: string; fr: string; en: string; aboutFr: string; aboutEn: string }> = {
  bunny: { name: "Praline", fr: "Hop hop hop !", en: "Hop hop hop!", aboutFr: "Une lapine qui saute.", aboutEn: "A bunny who hops." },
  panda: { name: "Bambou", fr: "Miam, du bambou !", en: "Yum, bamboo!", aboutFr: "Un panda qui croque.", aboutEn: "A panda who munches." },
  fox: { name: "Roux", fr: "Je trouve toujours !", en: "I always find it!", aboutFr: "Un renard qui trouve tout.", aboutEn: "A fox who finds things." },
  corgi: { name: "Biscuit", fr: "Ouaf ! On joue ?", en: "Woof! Wanna play?", aboutFr: "Un corgi qui veut jouer.", aboutEn: "A corgi who wants to play." },
  hamster: { name: "Noisette", fr: "J'ai des graines !", en: "I have seeds!", aboutFr: "Un hamster plein de graines.", aboutEn: "A hamster full of seeds." },
};

const MOCHI = {
  id: "mochi" as const,
  name: "Mochi",
  aboutFr: "Un gros chat blanc. Il aime la sieste.",
  aboutEn: "A fat white cat. He likes a nap.",
};

export function friendCards(unlocked: readonly string[], lang: "fr" | "en") {
  const met = new Set(crewWithStarter(unlocked));
  const mochi = {
    id: MOCHI.id,
    name: MOCHI.name,
    line: lang === "en" ? MOCHI.aboutEn : MOCHI.aboutFr,
    locked: false,
  };
  const friends = BUBBLE_FRIENDS.map((id) => {
    const cast = FRIEND_CAST[id];
    const locked = !met.has(id);
    return {
      id,
      name: locked ? "" : cast.name,
      line: locked ? "" : lang === "en" ? cast.aboutEn : cast.aboutFr,
      locked,
    };
  });
  return [mochi, ...friends];
}
