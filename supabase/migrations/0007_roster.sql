-- 0007 roster
-- A draft of a roster photo. It becomes a real day only after a parent presses Confirm.
-- The description shows under the table name in the Supabase table editor.

create table if not exists roster_drafts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  status roster_status not null,
  unique (family_id, member_id, date)
);

alter table roster_drafts enable row level security;

drop policy if exists roster_drafts_all on roster_drafts;
create policy roster_drafts_all on roster_drafts for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

grant select, insert, update, delete on roster_drafts to authenticated;

comment on table roster_drafts is 'Days read from a roster photo. They are not on the calendar until a parent confirms them.';
comment on column roster_drafts.date is 'The calendar day this draft row is about.';
comment on column roster_drafts.status is 'off, flying, standby, or layover. The parent can change this before confirming.';
comment on column roster_drafts.member_id is 'The parent this roster belongs to.';
