-- 0009 town
-- Twelve plots where stars buy a building. The purchase spends stars in one step.
-- The description shows under the table name in the Supabase table editor.

create table if not exists town_plots (
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  slot int not null check (slot >= 0 and slot <= 11),
  item text not null,
  primary key (child_id, slot)
);

alter table town_plots enable row level security;

drop policy if exists town_plots_select on town_plots;
create policy town_plots_select on town_plots for select to authenticated
  using (is_member(family_id));

grant select on town_plots to authenticated;

create or replace function buy_town_item(p_child uuid, p_slot int, p_item text) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  fam uuid;
  cost int;
  bal int;
  cap text;
  spent int;
begin
  select family_id into fam from children where id = p_child;
  if fam is null or not is_member(fam) then raise exception 'forbidden'; end if;
  if p_slot < 0 or p_slot > 11 then raise exception 'bad slot'; end if;
  cost := case p_item
    when 'flowers' then 1
    when 'tree' then 2
    when 'house' then 5
    when 'fountain' then 6
    when 'school' then 8
    when 'bakery' then 8
    when 'carousel' then 12
    when 'castle' then 20
    else null
  end;
  if cost is null then raise exception 'bad item'; end if;
  if exists (select 1 from town_plots where child_id = p_child and slot = p_slot) then
    raise exception 'filled';
  end if;
  select settings->>'town_star_cap' into cap from families where id = fam;
  if cap ~ '^[0-9]+$' then
    select coalesce(sum(
      case item
        when 'flowers' then 1 when 'tree' then 2 when 'house' then 5 when 'fountain' then 6
        when 'school' then 8 when 'bakery' then 8 when 'carousel' then 12 when 'castle' then 20
        else 0
      end
    ), 0) into spent from town_plots where child_id = p_child;
    if spent + cost > cap::int then raise exception 'town cap'; end if;
  end if;
  update children
    set star_balance = star_balance - cost
    where id = p_child and star_balance >= cost
    returning star_balance into bal;
  if bal is null then raise exception 'not enough stars'; end if;
  insert into town_plots (family_id, child_id, slot, item) values (fam, p_child, p_slot, p_item);
  insert into star_ledger (child_id, amount, reason) values (p_child, -cost, 'town:' || p_item);
  return bal;
end $$;

grant execute on function buy_town_item(uuid, int, text) to authenticated;

comment on table town_plots is 'A building or decoration Yana placed in her town. Stars are spent by buy_town_item.';
comment on column town_plots.slot is 'The plot, from 0 to 11.';
comment on column town_plots.item is 'flowers, tree, house, fountain, school, bakery, carousel, or castle.';
comment on function buy_town_item(uuid, int, text) is 'Spends stars and places one town item. Refuses a full plot, a low balance, or a parent cap.';
