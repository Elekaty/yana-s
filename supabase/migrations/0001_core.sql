-- 0001 core
-- Family tables, the two-tick archive rule, and stars. Safe to run again if these already exist.

create extension if not exists pgcrypto with schema extensions;

do $$
begin
  begin
    create type member_role as enum ('parent', 'guest');
  exception when duplicate_object then null;
  end;
  begin
    create type message_source as enum ('telegram', 'email', 'upload');
  exception when duplicate_object then null;
  end;
  begin
    create type message_tier as enum ('urgent', 'important', 'fyi');
  exception when duplicate_object then null;
  end;
  begin
    create type message_status as enum ('new', 'archived');
  exception when duplicate_object then null;
  end;
  begin
    create type task_status as enum ('pending', 'completed');
  exception when duplicate_object then null;
  end;
  begin
    create type reminder_target as enum ('parent', 'child');
  exception when duplicate_object then null;
  end;
  begin
    create type reminder_status as enum ('pending', 'sent', 'done', 'snoozed');
  exception when duplicate_object then null;
  end;
  begin
    create type roster_status as enum ('off', 'flying', 'standby', 'layover');
  exception when duplicate_object then null;
  end;
  begin
    create type game_type as enum ('flashcard', 'logic', 'physical');
  exception when duplicate_object then null;
  end;
  begin
    create type purchase_status as enum ('requested', 'approved', 'denied');
  exception when duplicate_object then null;
  end;
end $$;

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text,
  timezone text not null default 'Europe/Paris',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null,
  display_name text not null,
  unique (user_id)
);

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  grade text not null default 'CE1',
  language text not null default 'fr' check (language in ('fr', 'en')),
  star_balance int not null default 0,
  settings jsonb not null default '{}'::jsonb
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  source message_source not null,
  external_id text not null,
  raw jsonb,
  original_text text,
  title text,
  summary_en text,
  tier message_tier,
  type text,
  due_at timestamptz,
  event_at timestamptz,
  action_required boolean not null default false,
  confidence real,
  status message_status not null default 'new',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (family_id, source, external_id)
);

create table if not exists message_acks (
  message_id uuid not null references messages(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  acked_at timestamptz not null default now(),
  family_id uuid references families(id) on delete cascade,
  primary key (message_id, member_id)
);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  message_id uuid references messages(id) on delete cascade,
  path text not null,
  mime text,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  source_message_id uuid references messages(id) on delete set null,
  remind_offsets int[]
);

create table if not exists homework_scans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  image_path text not null,
  status text not null default 'saved',
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  scan_id uuid references homework_scans(id) on delete set null,
  title text,
  subject text,
  translated_objective text,
  parent_action text,
  curriculum_skill text,
  confidence real,
  coaching jsonb,
  status task_status not null default 'pending',
  reward_stars int,
  due_at timestamptz,
  assignee_member_id uuid references members(id) on delete set null
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  target reminder_target not null,
  member_id uuid references members(id) on delete set null,
  child_id uuid references children(id) on delete set null,
  ref_type text,
  ref_id uuid,
  due_at timestamptz not null,
  status reminder_status not null default 'pending',
  snooze_count int not null default 0
);

create table if not exists roster_days (
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  status roster_status not null,
  start_at timestamptz,
  end_at timestamptz,
  primary key (family_id, member_id, date)
);

create table if not exists availability (
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  from_time time not null,
  to_time time not null,
  primary key (member_id, weekday)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  date date not null,
  start_time time,
  leader_member_id uuid references members(id) on delete set null,
  duration_min int,
  status text
);

create table if not exists mini_games (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  game_type game_type not null,
  game_data jsonb not null default '{}'::jsonb
);

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  game text not null,
  score int,
  stars int,
  created_at timestamptz not null default now()
);

create table if not exists skill_progress (
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  skill text not null,
  level int not null default 0,
  correct int not null default 0,
  attempts int not null default 0,
  primary key (child_id, skill)
);

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  slug text not null unique,
  title_fr text not null,
  title_en text not null,
  pages jsonb not null default '[]'::jsonb
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  area text not null,
  title_fr text not null,
  explanation_en text not null,
  ask_fr text not null,
  sort int not null default 0
);

create table if not exists story_reads (
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  story_id uuid not null references stories(id) on delete cascade,
  completed_at timestamptz,
  primary key (child_id, story_id)
);

create table if not exists voice_recordings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  path text not null,
  created_at timestamptz not null default now(),
  parent_reaction text
);

create table if not exists rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  cost_stars int not null check (cost_stars > 0),
  active boolean not null default true
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  reward_id uuid not null references rewards(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  status purchase_status not null default 'requested'
);

create table if not exists star_ledger (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists friends_unlocked (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  friend text not null,
  unlocked_at timestamptz not null default now(),
  unique (child_id, friend)
);

create table if not exists child_outfits (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  outfit text not null,
  equipped boolean not null default false
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  attempts int not null default 0,
  run_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  endpoint text not null,
  keys jsonb,
  created_at timestamptz not null default now()
);

create index if not exists members_family_idx on members (family_id);
create index if not exists children_family_idx on children (family_id);
create index if not exists messages_family_idx on messages (family_id, status);

create or replace function fill_ack_family()
returns trigger
language plpgsql
as $$
begin
  if new.family_id is null then
    select family_id into new.family_id from messages where id = new.message_id;
  end if;
  return new;
end $$;

drop trigger if exists message_acks_family on message_acks;
create trigger message_acks_family
before insert on message_acks
for each row execute function fill_ack_family();

create or replace function fill_ledger_family()
returns trigger
language plpgsql
as $$
begin
  if new.family_id is null then
    select family_id into new.family_id from children where id = new.child_id;
  end if;
  return new;
end $$;

drop trigger if exists star_ledger_family on star_ledger;
create trigger star_ledger_family
before insert on star_ledger
for each row execute function fill_ledger_family();

create or replace function protect_family_secrets()
returns trigger
language plpgsql
as $$
begin
  if new.pin_hash is distinct from old.pin_hash
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'use set_family_pin';
  end if;
  if new.invite_code is distinct from old.invite_code
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return new;
end $$;

drop trigger if exists families_protect on families;
create trigger families_protect
before update on families
for each row execute function protect_family_secrets();

create or replace function protect_star_balance()
returns trigger
language plpgsql
as $$
begin
  if new.star_balance is distinct from old.star_balance
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'use award_stars';
  end if;
  return new;
end $$;

drop trigger if exists children_protect_stars on children;
create trigger children_protect_stars
before update on children
for each row execute function protect_star_balance();

create or replace function protect_member_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'forbidden';
  end if;
  return new;
end $$;

drop trigger if exists members_protect_role on members;
create trigger members_protect_role
before update on members
for each row execute function protect_member_role();

create or replace function protect_message_archive()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'archived' and old.status is distinct from 'archived'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'use archive_message';
  end if;
  return new;
end $$;

drop trigger if exists messages_protect_archive on messages;
create trigger messages_protect_archive
before update on messages
for each row execute function protect_message_archive();

-- Critical SQL, implemented exactly.
create or replace function is_member(fam uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from members where family_id=fam and user_id=auth.uid()) $$;

create or replace function archive_message(p_msg uuid) returns void language plpgsql security definer set search_path=public as $$
declare fam uuid;
begin
  select family_id into fam from messages where id=p_msg;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  if (select count(distinct a.member_id) from message_acks a join members m on m.id=a.member_id
      where a.message_id=p_msg and m.role='parent')
     < (select count(*) from members where family_id=fam and role='parent') then
    raise exception 'both parents must tick first';
  end if;
  update messages set status='archived', archived_at=now() where id=p_msg;
end $$;

create or replace function award_stars(p_child uuid, p_amount int, p_reason text) returns int
language plpgsql security definer set search_path=public as $$
declare fam uuid; today_total int; bal int;
begin
  select family_id into fam from children where id=p_child;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  if p_amount < 1 or p_amount > 5 then raise exception 'bad amount'; end if;
  select coalesce(sum(amount),0) into today_total from star_ledger
    where child_id=p_child and amount>0 and created_at::date=current_date;
  if today_total >= 60 then return (select star_balance from children where id=p_child); end if;
  insert into star_ledger(child_id,amount,reason) values(p_child,p_amount,p_reason);
  update children set star_balance=star_balance+p_amount where id=p_child returning star_balance into bal;
  return bal;
end $$;

create or replace function create_family(
  p_name text,
  p_timezone text,
  p_display_name text,
  p_child_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fam uuid;
  code text;
begin
  if uid is null then raise exception 'forbidden'; end if;
  if exists(select 1 from members where user_id = uid) then
    raise exception 'already in a family';
  end if;
  if length(trim(coalesce(p_name, ''))) < 1
     or length(trim(coalesce(p_display_name, ''))) < 1
     or length(trim(coalesce(p_child_name, ''))) < 1 then
    raise exception 'missing name';
  end if;
  code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into families(name, timezone, invite_code)
  values (trim(p_name), coalesce(nullif(trim(p_timezone), ''), 'Europe/Paris'), code)
  returning id into fam;
  insert into members(family_id, user_id, role, display_name)
  values (fam, uid, 'parent', trim(p_display_name));
  insert into children(family_id, name)
  values (fam, trim(p_child_name));
  return fam;
end $$;

create or replace function join_family(p_code text, p_display_name text) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  fam uuid;
  parents int;
begin
  if uid is null then raise exception 'forbidden'; end if;
  if exists(select 1 from members where user_id = uid) then
    raise exception 'already in a family';
  end if;
  if length(trim(coalesce(p_display_name, ''))) < 1 then
    raise exception 'missing name';
  end if;
  select id into fam from families where invite_code = lower(trim(p_code));
  if fam is null then raise exception 'invite not found'; end if;
  select count(*) into parents from members where family_id = fam and role = 'parent';
  if parents >= 2 then raise exception 'family already has two parents'; end if;
  insert into members(family_id, user_id, role, display_name)
  values (fam, uid, 'parent', trim(p_display_name));
  return fam;
end $$;

create or replace function set_family_pin(p_pin text) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  fam uuid;
  role member_role;
begin
  if uid is null then raise exception 'forbidden'; end if;
  if p_pin !~ '^[0-9]{4,6}$' then raise exception 'pin must be 4 to 6 digits'; end if;
  select family_id, members.role into fam, role from members where user_id = uid;
  if role is distinct from 'parent' then raise exception 'forbidden'; end if;
  update families set pin_hash = crypt(p_pin, gen_salt('bf')) where id = fam;
end $$;

create or replace function verify_family_pin(p_pin text) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  fam uuid;
  hash text;
begin
  if uid is null then return false; end if;
  select family_id into fam from members where user_id = uid;
  if fam is null then return false; end if;
  select pin_hash into hash from families where id = fam;
  if hash is null then return false; end if;
  return hash = crypt(p_pin, hash);
end $$;

create or replace function family_has_pin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select f.pin_hash is not null
    from members m
    join families f on f.id = m.family_id
    where m.user_id = auth.uid()
  ), false)
$$;

create or replace function my_family() returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'family_id', f.id,
    'family_name', f.name,
    'invite_code', f.invite_code,
    'timezone', f.timezone,
    'has_pin', f.pin_hash is not null,
    'child_id', c.id,
    'child_name', c.name,
    'child_language', c.language,
    'star_balance', c.star_balance,
    'my_role', m.role,
    'my_name', m.display_name
  )
  from members m
  join families f on f.id = m.family_id
  left join lateral (
    select id, name, language, star_balance
    from children
    where family_id = f.id
    order by name
    limit 1
  ) c on true
  where m.user_id = auth.uid()
$$;

create or replace function approve_purchase(p_purchase uuid) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  fam uuid;
  cid uuid;
  cost int;
  role member_role;
  bal int;
begin
  select p.family_id, p.child_id, r.cost_stars
    into fam, cid, cost
  from purchases p
  join rewards r on r.id = p.reward_id
  where p.id = p_purchase and p.status = 'requested';
  if fam is null then raise exception 'not found'; end if;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  select m.role into role from members m where m.family_id = fam and m.user_id = auth.uid();
  if role is distinct from 'parent' then raise exception 'forbidden'; end if;
  update children
    set star_balance = star_balance - cost
    where id = cid and star_balance >= cost
    returning star_balance into bal;
  if bal is null then raise exception 'not enough stars'; end if;
  insert into star_ledger(child_id, amount, reason) values (cid, -cost, 'purchase');
  update purchases set status = 'approved' where id = p_purchase;
  return bal;
end $$;

create or replace function storage_family(object_name text) returns uuid
language plpgsql
stable
as $$
declare
  folder text := split_part(object_name, '/', 1);
begin
  if folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return folder::uuid;
  end if;
  return null;
end $$;

alter table families enable row level security;
alter table members enable row level security;
alter table children enable row level security;
alter table messages enable row level security;
alter table message_acks enable row level security;
alter table attachments enable row level security;
alter table events enable row level security;
alter table tasks enable row level security;
alter table reminders enable row level security;
alter table roster_days enable row level security;
alter table availability enable row level security;
alter table sessions enable row level security;
alter table homework_scans enable row level security;
alter table mini_games enable row level security;
alter table game_sessions enable row level security;
alter table skill_progress enable row level security;
alter table stories enable row level security;
alter table skills enable row level security;
alter table story_reads enable row level security;
alter table voice_recordings enable row level security;
alter table rewards enable row level security;
alter table purchases enable row level security;
alter table star_ledger enable row level security;
alter table friends_unlocked enable row level security;
alter table child_outfits enable row level security;
alter table jobs enable row level security;
alter table push_subscriptions enable row level security;

drop policy if exists families_select on families;
create policy families_select on families for select to authenticated using (is_member(id));
drop policy if exists families_update on families;
create policy families_update on families for update to authenticated
  using (is_member(id)) with check (is_member(id));

drop policy if exists members_select on members;
create policy members_select on members for select to authenticated using (is_member(family_id));
drop policy if exists members_update on members;
create policy members_update on members for update to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

drop policy if exists children_select on children;
create policy children_select on children for select to authenticated using (is_member(family_id));
drop policy if exists children_update on children;
create policy children_update on children for update to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

drop policy if exists messages_select on messages;
create policy messages_select on messages for select to authenticated using (is_member(family_id));
drop policy if exists messages_insert on messages;
create policy messages_insert on messages for insert to authenticated with check (is_member(family_id));
drop policy if exists messages_update on messages;
create policy messages_update on messages for update to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

drop policy if exists message_acks_all on message_acks;
create policy message_acks_all on message_acks for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists attachments_all on attachments;
create policy attachments_all on attachments for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists events_all on events;
create policy events_all on events for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists tasks_all on tasks;
create policy tasks_all on tasks for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists reminders_all on reminders;
create policy reminders_all on reminders for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists roster_days_all on roster_days;
create policy roster_days_all on roster_days for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists availability_all on availability;
create policy availability_all on availability for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists sessions_all on sessions;
create policy sessions_all on sessions for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists homework_scans_all on homework_scans;
create policy homework_scans_all on homework_scans for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists mini_games_all on mini_games;
create policy mini_games_all on mini_games for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists game_sessions_all on game_sessions;
create policy game_sessions_all on game_sessions for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists skill_progress_all on skill_progress;
create policy skill_progress_all on skill_progress for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists stories_select on stories;
create policy stories_select on stories for select to authenticated
  using (family_id is null or is_member(family_id));
drop policy if exists skills_select on skills;
create policy skills_select on skills for select to authenticated
  using (family_id is null or is_member(family_id));
drop policy if exists story_reads_all on story_reads;
create policy story_reads_all on story_reads for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists voice_recordings_all on voice_recordings;
create policy voice_recordings_all on voice_recordings for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists rewards_all on rewards;
create policy rewards_all on rewards for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists purchases_all on purchases;
create policy purchases_all on purchases for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists star_ledger_select on star_ledger;
create policy star_ledger_select on star_ledger for select to authenticated using (is_member(family_id));
drop policy if exists friends_unlocked_all on friends_unlocked;
create policy friends_unlocked_all on friends_unlocked for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists child_outfits_all on child_outfits;
create policy child_outfits_all on child_outfits for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));
drop policy if exists jobs_select on jobs;
create policy jobs_select on jobs for select to authenticated using (family_id is not null and is_member(family_id));
drop policy if exists push_subscriptions_all on push_subscriptions;
create policy push_subscriptions_all on push_subscriptions for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

revoke select (pin_hash) on families from authenticated, anon;

grant execute on function is_member(uuid) to authenticated;
grant execute on function archive_message(uuid) to authenticated;
grant execute on function award_stars(uuid, int, text) to authenticated;
grant execute on function create_family(text, text, text, text) to authenticated;
grant execute on function join_family(text, text) to authenticated;
grant execute on function set_family_pin(text) to authenticated;
grant execute on function verify_family_pin(text) to authenticated;
grant execute on function family_has_pin() to authenticated;
grant execute on function my_family() to authenticated;
grant execute on function approve_purchase(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values
  ('scans', 'scans', false),
  ('voice', 'voice', false),
  ('attachments', 'attachments', false),
  ('family', 'family', false)
on conflict (id) do nothing;

drop policy if exists family_storage_read on storage.objects;
create policy family_storage_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('scans', 'voice', 'attachments', 'family')
    and public.is_member(public.storage_family(name))
  );

drop policy if exists family_storage_insert on storage.objects;
create policy family_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('scans', 'voice', 'attachments', 'family')
    and public.is_member(public.storage_family(name))
  );

drop policy if exists family_storage_update on storage.objects;
create policy family_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('scans', 'voice', 'attachments', 'family')
    and public.is_member(public.storage_family(name))
  )
  with check (
    bucket_id in ('scans', 'voice', 'attachments', 'family')
    and public.is_member(public.storage_family(name))
  );

drop policy if exists family_storage_delete on storage.objects;
create policy family_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('scans', 'voice', 'attachments', 'family')
    and public.is_member(public.storage_family(name))
  );

notify pgrst, 'reload schema';
