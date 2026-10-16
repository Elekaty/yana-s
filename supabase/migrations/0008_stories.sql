-- 0008 stories
-- Thirty short stories Yana can hear in French or English.
-- Descriptions show under the table name in the Supabase table editor.

comment on table stories is 'Short original stories. Each page has a French line and an English line.';
comment on column stories.slug is 'A stable name used to open the story.';
comment on column stories.title_fr is 'The title Yana sees in French.';
comment on column stories.title_en is 'The title Yana sees in English.';
comment on column stories.pages is 'The lines of the story, in order.';
comment on column voice_recordings.parent_reaction is 'A parent reaction: thumbs up, heart, or star.';
comment on table story_reads is 'A story Yana has finished. Stars are awarded once.';

insert into stories (family_id, slug, title_fr, title_en, pages) values
  (null, 'chat-lune', 'Le chat et la lune', 'The cat and the moon', '[{"fr":"Minou regarde la lune.","en":"Minou looks at the moon."},{"fr":"Il dit bonsoir tout bas.","en":"He says good night very softly."}]'::jsonb),
  (null, 'pluie-fenetre', 'La pluie à la fenêtre', 'Rain on the window', '[{"fr":"La pluie tape à la fenêtre.","en":"The rain taps on the window."},{"fr":"Mina dessine un soleil.","en":"Mina draws a sun."}]'::jsonb),
  (null, 'jardin-rouge', 'Le jardin rouge', 'The red garden', '[{"fr":"Une fleur rouge pousse.","en":"A red flower grows."},{"fr":"Une abeille vient dire bonjour.","en":"A bee comes to say hello."}]'::jsonb),
  (null, 'pain-chaud', 'Le pain chaud', 'Warm bread', '[{"fr":"Le pain sent bon.","en":"The bread smells good."},{"fr":"On le partage en deux.","en":"They share it in two."}]'::jsonb),
  (null, 'bateau-papier', 'Le bateau de papier', 'The paper boat', '[{"fr":"Léo plie un bateau.","en":"Leo folds a boat."},{"fr":"Le bateau flotte dans la bassine.","en":"The boat floats in the basin."}]'::jsonb),
  (null, 'chaussette-perdue', 'La chaussette perdue', 'The lost sock', '[{"fr":"Une chaussette se cache.","en":"A sock is hiding."},{"fr":"Elle était sous le lit.","en":"It was under the bed."}]'::jsonb),
  (null, 'oiseau-bleu', 'L''oiseau bleu', 'The blue bird', '[{"fr":"Un oiseau bleu chante.","en":"A blue bird sings."},{"fr":"Puis il vole vers le toit.","en":"Then it flies to the roof."}]'::jsonb),
  (null, 'soupe-carottes', 'La soupe aux carottes', 'Carrot soup', '[{"fr":"Les carottes dansent dans la soupe.","en":"The carrots dance in the soup."},{"fr":"Tout le monde dit merci.","en":"Everyone says thank you."}]'::jsonb),
  (null, 'etoile-timide', 'L''étoile timide', 'The shy star', '[{"fr":"Une petite étoile a peur.","en":"A little star is shy."},{"fr":"La lune lui tient compagnie.","en":"The moon keeps it company."}]'::jsonb),
  (null, 'ballon-jaune', 'Le ballon jaune', 'The yellow ball', '[{"fr":"Le ballon jaune rebondit.","en":"The yellow ball bounces."},{"fr":"Il revient toujours.","en":"It always comes back."}]'::jsonb),
  (null, 'fourmi-pont', 'La fourmi et le pont', 'The ant and the bridge', '[{"fr":"Une fourmi cherche un pont.","en":"An ant looks for a bridge."},{"fr":"Une feuille fait le chemin.","en":"A leaf makes the path."}]'::jsonb),
  (null, 'nuage-rose', 'Le nuage rose', 'The pink cloud', '[{"fr":"Un nuage rose passe.","en":"A pink cloud goes by."},{"fr":"Il laisse une goutte brillante.","en":"It leaves one bright drop."}]'::jsonb),
  (null, 'petite-cle', 'La petite clé', 'The little key', '[{"fr":"Nina trouve une clé.","en":"Nina finds a key."},{"fr":"La clé ouvre une boîte à crayons.","en":"The key opens a pencil box."}]'::jsonb),
  (null, 'poisson-rire', 'Le poisson qui rit', 'The fish who laughs', '[{"fr":"Le poisson fait des bulles.","en":"The fish makes bubbles."},{"fr":"Chaque bulle est un rire.","en":"Each bubble is a laugh."}]'::jsonb),
  (null, 'manteau-vert', 'Le manteau vert', 'The green coat', '[{"fr":"Le manteau vert est trop grand.","en":"The green coat is too big."},{"fr":"Il garde bien au chaud.","en":"It keeps someone warm."}]'::jsonb),
  (null, 'lune-biscuit', 'Le biscuit lune', 'The moon biscuit', '[{"fr":"Le biscuit a la forme d''une lune.","en":"The biscuit is shaped like a moon."},{"fr":"On le croque tout doucement.","en":"They nibble it slowly."}]'::jsonb),
  (null, 'petit-train', 'Le petit train', 'The little train', '[{"fr":"Le petit train dit tchou.","en":"The little train says choo."},{"fr":"Il emmène les peluches.","en":"It carries the soft toys."}]'::jsonb),
  (null, 'fleur-nuit', 'La fleur de nuit', 'The night flower', '[{"fr":"La fleur se ferme le jour.","en":"The flower closes by day."},{"fr":"Elle s''ouvre quand les étoiles arrivent.","en":"It opens when the stars come."}]'::jsonb),
  (null, 'le-crayon', 'Le crayon', 'The pencil', '[{"fr":"Le crayon dessine un chat.","en":"The pencil draws a cat."},{"fr":"Le chat a un grand sourire.","en":"The cat has a big smile."}]'::jsonb),
  (null, 'neige-douce', 'La neige douce', 'Soft snow', '[{"fr":"La neige tombe sans bruit.","en":"The snow falls without a sound."},{"fr":"Le jardin devient blanc.","en":"The garden turns white."}]'::jsonb),
  (null, 'la-grenouille', 'La grenouille', 'The frog', '[{"fr":"La grenouille saute dans une flaque.","en":"The frog jumps in a puddle."},{"fr":"Elle salue la pluie.","en":"It waves to the rain."}]'::jsonb),
  (null, 'la-pomme', 'La pomme', 'The apple', '[{"fr":"Une pomme est sur la table.","en":"An apple is on the table."},{"fr":"Deux amis la partagent.","en":"Two friends share it."}]'::jsonb),
  (null, 'vent-chapeau', 'Le vent et le chapeau', 'The wind and the hat', '[{"fr":"Le vent prend un chapeau.","en":"The wind takes a hat."},{"fr":"Il le pose sur un banc.","en":"It sets the hat on a bench."}]'::jsonb),
  (null, 'livre-ouvert', 'Le livre ouvert', 'The open book', '[{"fr":"Un livre s''ouvre tout seul.","en":"A book opens by itself."},{"fr":"Une histoire en sort.","en":"A story comes out."}]'::jsonb),
  (null, 'lampe-soir', 'La lampe du soir', 'The evening lamp', '[{"fr":"La lampe s''allume.","en":"The lamp turns on."},{"fr":"La chambre devient dorée.","en":"The room turns gold."}]'::jsonb),
  (null, 'le-canard', 'Le canard', 'The duck', '[{"fr":"Le canard traverse la flaque.","en":"The duck crosses the puddle."},{"fr":"Il laisse une ligne d''eau.","en":"It leaves a line of water."}]'::jsonb),
  (null, 'la-graine', 'La graine', 'The seed', '[{"fr":"Une graine attend sous la terre.","en":"A seed waits under the ground."},{"fr":"Le soleil lui dit de sortir.","en":"The sun tells it to come out."}]'::jsonb),
  (null, 'l-oreiller', 'L''oreiller', 'The pillow', '[{"fr":"L''oreiller est tout mou.","en":"The pillow is very soft."},{"fr":"Il garde un rêve au chaud.","en":"It keeps a dream warm."}]'::jsonb),
  (null, 'cloche-matin', 'La cloche du matin', 'The morning bell', '[{"fr":"Une petite cloche sonne.","en":"A little bell rings."},{"fr":"C''est l''heure du cacao.","en":"It is time for cocoa."}]'::jsonb),
  (null, 'ami-banc', 'L''ami du banc', 'The friend on the bench', '[{"fr":"Deux enfants sont sur un banc.","en":"Two children sit on a bench."},{"fr":"Ils regardent les nuages.","en":"They look at the clouds."}]'::jsonb)
on conflict (slug) do nothing;
