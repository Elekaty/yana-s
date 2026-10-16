export type StoryPage = { fr: string; en: string };

export type Story = {
  slug: string;
  title_fr: string;
  title_en: string;
  pages: StoryPage[];
};

export const STORIES: Story[] = [
  { slug: "chat-lune", title_fr: "Le chat et la lune", title_en: "The cat and the moon", pages: [{ fr: "Minou regarde la lune.", en: "Minou looks at the moon." }, { fr: "Il dit bonsoir tout bas.", en: "He says good night very softly." }] },
  { slug: "pluie-fenetre", title_fr: "La pluie à la fenêtre", title_en: "Rain on the window", pages: [{ fr: "La pluie tape à la fenêtre.", en: "The rain taps on the window." }, { fr: "Mina dessine un soleil.", en: "Mina draws a sun." }] },
  { slug: "jardin-rouge", title_fr: "Le jardin rouge", title_en: "The red garden", pages: [{ fr: "Une fleur rouge pousse.", en: "A red flower grows." }, { fr: "Une abeille vient dire bonjour.", en: "A bee comes to say hello." }] },
  { slug: "pain-chaud", title_fr: "Le pain chaud", title_en: "Warm bread", pages: [{ fr: "Le pain sent bon.", en: "The bread smells good." }, { fr: "On le partage en deux.", en: "They share it in two." }] },
  { slug: "bateau-papier", title_fr: "Le bateau de papier", title_en: "The paper boat", pages: [{ fr: "Léo plie un bateau.", en: "Leo folds a boat." }, { fr: "Le bateau flotte dans la bassine.", en: "The boat floats in the basin." }] },
  { slug: "chaussette-perdue", title_fr: "La chaussette perdue", title_en: "The lost sock", pages: [{ fr: "Une chaussette se cache.", en: "A sock is hiding." }, { fr: "Elle était sous le lit.", en: "It was under the bed." }] },
  { slug: "oiseau-bleu", title_fr: "L'oiseau bleu", title_en: "The blue bird", pages: [{ fr: "Un oiseau bleu chante.", en: "A blue bird sings." }, { fr: "Puis il vole vers le toit.", en: "Then it flies to the roof." }] },
  { slug: "soupe-carottes", title_fr: "La soupe aux carottes", title_en: "Carrot soup", pages: [{ fr: "Les carottes dansent dans la soupe.", en: "The carrots dance in the soup." }, { fr: "Tout le monde dit merci.", en: "Everyone says thank you." }] },
  { slug: "etoile-timide", title_fr: "L'étoile timide", title_en: "The shy star", pages: [{ fr: "Une petite étoile a peur.", en: "A little star is shy." }, { fr: "La lune lui tient compagnie.", en: "The moon keeps it company." }] },
  { slug: "ballon-jaune", title_fr: "Le ballon jaune", title_en: "The yellow ball", pages: [{ fr: "Le ballon jaune rebondit.", en: "The yellow ball bounces." }, { fr: "Il revient toujours.", en: "It always comes back." }] },
  { slug: "fourmi-pont", title_fr: "La fourmi et le pont", title_en: "The ant and the bridge", pages: [{ fr: "Une fourmi cherche un pont.", en: "An ant looks for a bridge." }, { fr: "Une feuille fait le chemin.", en: "A leaf makes the path." }] },
  { slug: "nuage-rose", title_fr: "Le nuage rose", title_en: "The pink cloud", pages: [{ fr: "Un nuage rose passe.", en: "A pink cloud goes by." }, { fr: "Il laisse une goutte brillante.", en: "It leaves one bright drop." }] },
  { slug: "petite-cle", title_fr: "La petite clé", title_en: "The little key", pages: [{ fr: "Nina trouve une clé.", en: "Nina finds a key." }, { fr: "La clé ouvre une boîte à crayons.", en: "The key opens a pencil box." }] },
  { slug: "poisson-rire", title_fr: "Le poisson qui rit", title_en: "The fish who laughs", pages: [{ fr: "Le poisson fait des bulles.", en: "The fish makes bubbles." }, { fr: "Chaque bulle est un rire.", en: "Each bubble is a laugh." }] },
  { slug: "manteau-vert", title_fr: "Le manteau vert", title_en: "The green coat", pages: [{ fr: "Le manteau vert est trop grand.", en: "The green coat is too big." }, { fr: "Il garde bien au chaud.", en: "It keeps someone warm." }] },
  { slug: "lune-biscuit", title_fr: "Le biscuit lune", title_en: "The moon biscuit", pages: [{ fr: "Le biscuit a la forme d'une lune.", en: "The biscuit is shaped like a moon." }, { fr: "On le croque tout doucement.", en: "They nibble it slowly." }] },
  { slug: "petit-train", title_fr: "Le petit train", title_en: "The little train", pages: [{ fr: "Le petit train dit tchou.", en: "The little train says choo." }, { fr: "Il emmène les peluches.", en: "It carries the soft toys." }] },
  { slug: "fleur-nuit", title_fr: "La fleur de nuit", title_en: "The night flower", pages: [{ fr: "La fleur se ferme le jour.", en: "The flower closes by day." }, { fr: "Elle s'ouvre quand les étoiles arrivent.", en: "It opens when the stars come." }] },
  { slug: "le-crayon", title_fr: "Le crayon", title_en: "The pencil", pages: [{ fr: "Le crayon dessine un chat.", en: "The pencil draws a cat." }, { fr: "Le chat a un grand sourire.", en: "The cat has a big smile." }] },
  { slug: "neige-douce", title_fr: "La neige douce", title_en: "Soft snow", pages: [{ fr: "La neige tombe sans bruit.", en: "The snow falls without a sound." }, { fr: "Le jardin devient blanc.", en: "The garden turns white." }] },
  { slug: "la-grenouille", title_fr: "La grenouille", title_en: "The frog", pages: [{ fr: "La grenouille saute dans une flaque.", en: "The frog jumps in a puddle." }, { fr: "Elle salue la pluie.", en: "It waves to the rain." }] },
  { slug: "la-pomme", title_fr: "La pomme", title_en: "The apple", pages: [{ fr: "Une pomme est sur la table.", en: "An apple is on the table." }, { fr: "Deux amis la partagent.", en: "Two friends share it." }] },
  { slug: "vent-chapeau", title_fr: "Le vent et le chapeau", title_en: "The wind and the hat", pages: [{ fr: "Le vent prend un chapeau.", en: "The wind takes a hat." }, { fr: "Il le pose sur un banc.", en: "It sets the hat on a bench." }] },
  { slug: "livre-ouvert", title_fr: "Le livre ouvert", title_en: "The open book", pages: [{ fr: "Un livre s'ouvre tout seul.", en: "A book opens by itself." }, { fr: "Une histoire en sort.", en: "A story comes out." }] },
  { slug: "lampe-soir", title_fr: "La lampe du soir", title_en: "The evening lamp", pages: [{ fr: "La lampe s'allume.", en: "The lamp turns on." }, { fr: "La chambre devient dorée.", en: "The room turns gold." }] },
  { slug: "le-canard", title_fr: "Le canard", title_en: "The duck", pages: [{ fr: "Le canard traverse la flaque.", en: "The duck crosses the puddle." }, { fr: "Il laisse une ligne d'eau.", en: "It leaves a line of water." }] },
  { slug: "la-graine", title_fr: "La graine", title_en: "The seed", pages: [{ fr: "Une graine attend sous la terre.", en: "A seed waits under the ground." }, { fr: "Le soleil lui dit de sortir.", en: "The sun tells it to come out." }] },
  { slug: "l-oreiller", title_fr: "L'oreiller", title_en: "The pillow", pages: [{ fr: "L'oreiller est tout mou.", en: "The pillow is very soft." }, { fr: "Il garde un rêve au chaud.", en: "It keeps a dream warm." }] },
  { slug: "cloche-matin", title_fr: "La cloche du matin", title_en: "The morning bell", pages: [{ fr: "Une petite cloche sonne.", en: "A little bell rings." }, { fr: "C'est l'heure du cacao.", en: "It is time for cocoa." }] },
  { slug: "ami-banc", title_fr: "L'ami du banc", title_en: "The friend on the bench", pages: [{ fr: "Deux enfants sont sur un banc.", en: "Two children sit on a bench." }, { fr: "Ils regardent les nuages.", en: "They look at the clouds." }] },
];

export function storyBySlug(slug: string) {
  return STORIES.find((story) => story.slug === slug) ?? null;
}
