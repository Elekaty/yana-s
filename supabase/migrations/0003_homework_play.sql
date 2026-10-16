-- 0003 homework play
-- Yana's place in a homework page, and the study/break clock. Descriptions show in the Supabase table editor.

alter table families add column if not exists settings jsonb not null default '{}'::jsonb;

create table if not exists homework_runs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  child_id uuid not null references children(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  step_index int not null default 0,
  hint_level int not null default 0 check (hint_level between 0 and 3),
  status text not null default 'doing' check (status in ('doing', 'done', 'stuck', 'needs_you')),
  awarded_steps int[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (child_id, task_id)
);

create table if not exists study_clocks (
  child_id uuid primary key references children(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  mode text not null default 'study' check (mode in ('study', 'heads_up', 'break')),
  remaining_sec int not null check (remaining_sec >= 0),
  postponements int not null default 0 check (postponements >= 0),
  break_awarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table homework_runs enable row level security;
alter table study_clocks enable row level security;

drop policy if exists homework_runs_all on homework_runs;
create policy homework_runs_all on homework_runs for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

drop policy if exists study_clocks_all on study_clocks;
create policy study_clocks_all on study_clocks for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

grant select, insert, update, delete on homework_runs to authenticated;
grant select, insert, update, delete on study_clocks to authenticated;

comment on column families.settings is 'Study and break timings: study_minutes, break_minutes, heads_up_minutes, max_postponements.';
comment on table homework_runs is 'Where Yana stopped in a homework page: the step, the hint, and whether she is doing it, done, stuck, or needs a parent.';
comment on column homework_runs.step_index is 'Which mini-task she is on, starting at 0.';
comment on column homework_runs.hint_level is '0 none, 1 first hint, 2 second hint, 3 answer shown.';
comment on column homework_runs.status is 'doing, done, stuck, or needs_you.';
comment on column homework_runs.awarded_steps is 'Steps that already received stars, so a refresh does not award them again.';
comment on table study_clocks is 'The study and break timer for one child. Time counts only while the app is open and the screen was touched recently.';
comment on column study_clocks.mode is 'study, heads_up (the last few minutes), or break.';
comment on column study_clocks.remaining_sec is 'Seconds left in the current study block or break.';
comment on column study_clocks.postponements is 'How many times the heads-up was pushed back. The default cap is 2.';
