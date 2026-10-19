-- 0012 garden
-- Finishing an activity plants the next thing. Stars are never spent here.

create table if not exists garden_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  slot int not null check (slot >= 0 and slot <= 11),
  kind text not null,
  planted_at timestamptz not null default now(),
  unique (child_id, slot)
);

alter table garden_items enable row level security;

drop policy if exists garden_items_select on garden_items;
create policy garden_items_select on garden_items for select to authenticated
  using (is_member(family_id));

grant select on garden_items to authenticated;

create or replace function plant_next(p_child uuid) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  fam uuid;
  planted int;
  kind text;
  kinds text[] := array[
    'flower', 'tree', 'bee', 'house', 'sunflower', 'fountain',
    'butterfly', 'bakery', 'mushroom', 'carousel', 'rainbow', 'castle'
  ];
begin
  select family_id into fam from children where id = p_child;
  if fam is null or not is_member(fam) then raise exception 'forbidden'; end if;
  select count(*) into planted from garden_items where child_id = p_child;
  if planted >= 12 then return ''; end if;
  kind := kinds[planted + 1];
  insert into garden_items (family_id, child_id, slot, kind) values (fam, p_child, planted, kind);
  return kind;
end $$;

grant execute on function plant_next(uuid) to authenticated;

comment on table garden_items is 'Something that grew in the garden after a finished activity. plant_next adds the next one and does not spend stars.';
comment on column garden_items.slot is 'The plot, from 0 to 11, in grow order.';
comment on column garden_items.kind is 'flower, tree, bee, house, sunflower, fountain, butterfly, bakery, mushroom, carousel, rainbow, or castle.';
comment on function plant_next(uuid) is 'Plants the next garden item for the child. Returns an empty string when the garden is full. Does not change stars.';
