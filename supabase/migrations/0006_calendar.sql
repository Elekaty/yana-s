-- 0006 calendar
-- School holidays, a private calendar link, and a note when a reminder was snoozed three times.
-- Descriptions show under the table name in the Supabase table editor.

alter table reminders add column if not exists note text;
alter table reminders add column if not exists escalated boolean not null default false;

alter table families add column if not exists ics_token uuid default gen_random_uuid();
update families set ics_token = gen_random_uuid() where ics_token is null;
alter table families alter column ics_token set not null;
create unique index if not exists families_ics_token_idx on families (ics_token);

create table if not exists school_calendar (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  kind text not null check (kind in ('holiday', 'event')),
  starts_on date not null,
  ends_on date not null,
  label text not null,
  source text not null default 'national',
  zone text,
  check (ends_on >= starts_on)
);

create unique index if not exists school_calendar_national_idx
  on school_calendar (label, starts_on)
  where family_id is null;

alter table school_calendar enable row level security;

drop policy if exists school_calendar_select on school_calendar;
create policy school_calendar_select on school_calendar for select to authenticated
  using (family_id is null or is_member(family_id));

drop policy if exists school_calendar_write on school_calendar;
create policy school_calendar_write on school_calendar for all to authenticated
  using (family_id is not null and is_member(family_id))
  with check (family_id is not null and is_member(family_id));

grant select, insert, update, delete on school_calendar to authenticated;

insert into school_calendar (family_id, kind, starts_on, ends_on, label, source, zone)
values
  (null, 'holiday', '2026-10-17', '2026-11-01', 'Toussaint break', 'national', null),
  (null, 'event', '2026-11-02', '2026-11-02', 'Back to school', 'national', null),
  (null, 'holiday', '2026-11-11', '2026-11-11', 'Armistice', 'national', null),
  (null, 'holiday', '2026-12-19', '2027-01-03', 'Christmas break', 'national', null),
  (null, 'event', '2027-01-04', '2027-01-04', 'Back to school', 'national', null),
  (null, 'holiday', '2027-02-13', '2027-03-01', 'Winter break', 'national', 'A'),
  (null, 'holiday', '2027-02-20', '2027-03-08', 'Winter break', 'national', 'B'),
  (null, 'holiday', '2027-02-06', '2027-02-22', 'Winter break', 'national', 'C'),
  (null, 'holiday', '2027-03-29', '2027-03-29', 'Easter Monday', 'national', null),
  (null, 'holiday', '2027-05-17', '2027-05-17', 'Pentecost Monday', 'national', null),
  (null, 'event', '2027-07-03', '2027-07-03', 'School year ends', 'national', null)
on conflict (label, starts_on) where family_id is null do nothing;

comment on table school_calendar is 'French school holidays for 2026-2027. A family row with the same label replaces the national date.';
comment on column school_calendar.kind is 'holiday or event.';
comment on column school_calendar.starts_on is 'First day, inclusive.';
comment on column school_calendar.ends_on is 'Last day, inclusive.';
comment on column school_calendar.label is 'The name parents see, such as Toussaint break.';
comment on column school_calendar.source is 'national, or parent when the family changed the date.';
comment on column school_calendar.zone is 'A, B, or C for the winter break. Empty for holidays that apply to every zone.';
comment on column families.ics_token is 'Secret used in the private calendar link. Anyone with the link can see event titles.';
comment on column reminders.note is 'Shown when a reminder moved to the next morning after 3 snoozes.';
comment on column reminders.escalated is 'True after the other parent was told this reminder is still waiting.';
