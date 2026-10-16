-- 0010 plan
-- A monthly outline and the CE1 skills. A family edit replaces the shared line and leaves the original in place.
-- Descriptions show under the table name in the Supabase table editor.

alter table skills add column if not exists skill_key text;

create unique index if not exists skills_skill_key on skills (skill_key);

create table if not exists plan_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  item_key text not null,
  month text not null,
  period int not null,
  subject text not null,
  text text not null,
  source text not null check (source in ('national', 'typical', 'parent')),
  done boolean not null default false,
  hidden boolean not null default false
);

create unique index if not exists plan_items_shared_key on plan_items (item_key) where family_id is null;
create unique index if not exists plan_items_family_key on plan_items (family_id, item_key) where family_id is not null;

alter table plan_items enable row level security;

drop policy if exists plan_items_select on plan_items;
create policy plan_items_select on plan_items for select to authenticated
  using (family_id is null or is_member(family_id));
drop policy if exists plan_items_insert on plan_items;
create policy plan_items_insert on plan_items for insert to authenticated
  with check (family_id is not null and is_member(family_id));
drop policy if exists plan_items_update on plan_items;
create policy plan_items_update on plan_items for update to authenticated
  using (family_id is not null and is_member(family_id))
  with check (family_id is not null and is_member(family_id));
drop policy if exists plan_items_delete on plan_items;
create policy plan_items_delete on plan_items for delete to authenticated
  using (family_id is not null and is_member(family_id));

grant select on skills to authenticated;
grant select, insert, update, delete on plan_items to authenticated;

comment on table plan_items is 'The monthly outline. A family row with the same key replaces the shared line.';
comment on column plan_items.item_key is 'A stable name. The family copy uses the same key as the shared line.';
comment on column plan_items.month is 'The month, written as YYYY-MM.';
comment on column plan_items.source is 'national, typical, or parent.';
comment on column plan_items.hidden is 'A family copy can hide the shared line without deleting it.';
comment on column skills.skill_key is 'The name play uses when it updates this skill.';
comment on table skills is 'A general CE1 outline. Play and a parent can raise the status. A higher status stays.';

insert into skills (family_id, skill_key, area, title_fr, explanation_en, ask_fr, sort)
select v.family_id, v.skill_key, v.area, v.title_fr, v.explanation_en, v.ask_fr, v.sort
from (values
  (null::uuid, 'reading', 'Français', 'Lire un court texte', 'She reads a few sentences aloud.', 'Tu lis cette phrase ?', 1),
  (null, 'dictation', 'Français', 'Ecrire une phrase', 'She writes a short sentence she hears.', 'Tu écris ce que tu entends ?', 2),
  (null, 'grammar', 'Français', 'Nom et verbe', 'She can point to a noun and a verb.', 'Où est le verbe ?', 3),
  (null, 'spelling', 'Français', 'Les sons fréquents', 'She spells a few common sounds.', 'Comment tu écris ce son ?', 4),
  (null, 'writing', 'Français', 'Deux phrases', 'She writes two sentences about a picture.', 'Tu racontes l''image ?', 5),
  (null, 'poetry', 'Français', 'Une petite poésie', 'She learns a short poem.', 'Tu dis le premier vers ?', 6),
  (null, 'numbers', 'Mathématiques', 'Les nombres jusqu''à 1000', 'She reads and writes numbers up to 1000.', 'Quel nombre est le plus grand ?', 7),
  (null, 'tables', 'Mathématiques', 'Les tables de 2, 5 et 10', 'She practices the tables set by a parent.', 'Combien font 2 fois 5 ?', 8),
  (null, 'add', 'Mathématiques', 'Ajouter et retrancher', 'She adds and subtracts within 100.', 'Combien font 20 et 4 ?', 9),
  (null, 'fractions', 'Mathématiques', 'Moitié et quart', 'She uses halves and quarters.', 'Montre-moi la moitié.', 10),
  (null, 'measure', 'Mathématiques', 'Mesurer en centimètres', 'She measures a length.', 'C''est long de combien ?', 11),
  (null, 'money', 'Mathématiques', 'Les pièces', 'She knows a few coins and a simple price.', 'Ça coûte combien ?', 12),
  (null, 'problem', 'Mathématiques', 'Un petit problème', 'She solves a short problem in steps.', 'Que fait-on en premier ?', 13),
  (null, 'time', 'Questionner le monde', 'Le temps qui passe', 'She knows days, months, and the clock.', 'On est quel jour ?', 14),
  (null, 'living', 'Questionner le monde', 'Le vivant', 'She can say what a plant needs.', 'De quoi a besoin une plante ?', 15),
  (null, 'space', 'Questionner le monde', 'Un petit plan', 'She reads a very simple map.', 'Où est la porte ?', 16),
  (null, 'matter', 'Questionner le monde', 'Solide et liquide', 'She sorts solid and liquid.', 'L''eau est solide ou liquide ?', 17),
  (null, 'vocabulary', 'Langue vivante', 'Quelques mots', 'She knows a few everyday words.', 'Comment tu dis chat ?', 18),
  (null, 'music', 'Langue vivante', 'Une chanson courte', 'She follows a short song.', 'Tu chantes le début ?', 19),
  (null, 'rules', 'EMC', 'Les règles du groupe', 'She can name a class rule.', 'Quelle est la règle ?', 20),
  (null, 'feelings', 'EMC', 'Dire un sentiment', 'She names a feeling.', 'Comment tu te sens ?', 21),
  (null, 'together', 'EMC', 'Aider un ami', 'She talks about helping a friend.', 'Comment on aide un ami ?', 22),
  (null, 'calendar', 'Questionner le monde', 'La date', 'She can say today''s date.', 'On est quel mois ?', 23)
) as v(family_id, skill_key, area, title_fr, explanation_en, ask_fr, sort)
where not exists (select 1 from skills s where s.skill_key = v.skill_key);

insert into plan_items (family_id, item_key, month, period, subject, text, source)
select null, v.item_key, v.month, v.period, v.subject, v.text, v.source
from (values
  ('eval-sep', '2026-09', 1, 'Maths', 'National check: numbers and reading at the start of the year.', 'national'),
  ('read-sep', '2026-09', 1, 'Français', 'Read a short text and talk about it.', 'typical'),
  ('toussaint', '2026-10', 1, 'Calendar', 'Toussaint break. A light week is enough.', 'national'),
  ('numbers-oct', '2026-10', 1, 'Maths', 'Read numbers up to 100.', 'typical'),
  ('times-2', '2026-11', 2, 'Maths', 'National marker: the table of 2 starts in period 2.', 'national'),
  ('sentence-nov', '2026-11', 2, 'Français', 'Write one sentence with a capital and a full stop.', 'typical'),
  ('christmas', '2026-12', 2, 'Calendar', 'Christmas break starts late in the month.', 'national'),
  ('story-dec', '2026-12', 2, 'Français', 'Listen to a short story and retell it.', 'typical'),
  ('times-more', '2027-01', 3, 'Maths', 'National marker: tables of 10, 3, 4 and 5 by period 3.', 'national'),
  ('thousand', '2027-01', 3, 'Maths', 'Numbers toward 1000.', 'typical'),
  ('winter', '2027-02', 3, 'Calendar', 'Winter break follows the family zone.', 'national'),
  ('half', '2027-02', 3, 'Maths', 'Halves of a shape and a number.', 'typical'),
  ('easter', '2027-03', 4, 'Calendar', 'Easter Monday is a school holiday.', 'national'),
  ('measure-mar', '2027-03', 4, 'Maths', 'Measure a length in centimetres.', 'typical'),
  ('plant-apr', '2027-04', 4, 'Monde', 'What a plant needs to grow.', 'typical'),
  ('dictation-apr', '2027-04', 4, 'Français', 'A short dictation of familiar words.', 'typical'),
  ('pentecost', '2027-05', 5, 'Calendar', 'Pentecost Monday is a school holiday.', 'national'),
  ('map-may', '2027-05', 5, 'Monde', 'Read a simple plan of a room.', 'typical'),
  ('year-end', '2027-06', 5, 'Calendar', 'The school year ends in early July.', 'national'),
  ('review-jun', '2027-06', 5, 'Français', 'Review a story, a table, and a number.', 'typical')
) as v(item_key, month, period, subject, text, source)
where not exists (select 1 from plan_items p where p.family_id is null and p.item_key = v.item_key);
