import type { BubbleFriend } from "@/lib/mochi";

export const FRIEND_CAST: Record<BubbleFriend, { name: string; fr: string; en: string }> = {
  bunny: { name: "Praline", fr: "Hop hop hop !", en: "Hop hop hop!" },
  panda: { name: "Bambou", fr: "Miam, du bambou !", en: "Yum, bamboo!" },
  fox: { name: "Roux", fr: "Je trouve toujours !", en: "I always find it!" },
  corgi: { name: "Biscuit", fr: "Ouaf ! On joue ?", en: "Woof! Wanna play?" },
  hamster: { name: "Noisette", fr: "J'ai des graines !", en: "I have seeds!" },
};
