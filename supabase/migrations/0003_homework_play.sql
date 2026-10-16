-- Homework progress and the study/break clock. Stars still change only through award_stars.

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

create policy homework_runs_all on homework_runs for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

create policy study_clocks_all on study_clocks for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

grant select, insert, update, delete on homework_runs to authenticated;
grant select, insert, update, delete on study_clocks to authenticated;
