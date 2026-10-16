-- 0005 inbox
-- Sender rules, restoring an archived message, and the record of a late urgent alert.
-- Descriptions show under the table name in the Supabase table editor.

create table if not exists sender_rules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  sender text not null,
  tier message_tier not null,
  unique (family_id, sender)
);

create table if not exists message_alerts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  message_id uuid not null references messages(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  unique (message_id, member_id, kind)
);

create table if not exists digest_marks (
  family_id uuid not null references families(id) on delete cascade,
  kind text not null,
  day date not null,
  primary key (family_id, kind, day)
);

alter table messages add column if not exists sender text;
alter table messages add column if not exists please_check boolean not null default false;

alter table sender_rules enable row level security;
alter table message_alerts enable row level security;
alter table digest_marks enable row level security;

drop policy if exists sender_rules_all on sender_rules;
create policy sender_rules_all on sender_rules for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

drop policy if exists message_alerts_select on message_alerts;
create policy message_alerts_select on message_alerts for select to authenticated
  using (is_member(family_id));

drop policy if exists digest_marks_select on digest_marks;
create policy digest_marks_select on digest_marks for select to authenticated
  using (is_member(family_id));

grant select, insert, update, delete on sender_rules to authenticated;
grant select on message_alerts to authenticated;
grant select on digest_marks to authenticated;

create or replace function restore_message(p_msg uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare fam uuid;
begin
  select family_id into fam from messages where id = p_msg;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  update messages set status = 'new', archived_at = null where id = p_msg and status = 'archived';
end $$;

grant execute on function restore_message(uuid) to authenticated;

comment on table sender_rules is 'A parent choice: always treat this sender as urgent, important, or FYI.';
comment on column sender_rules.sender is 'An email address, or telegram: and the chat id.';
comment on column sender_rules.tier is 'urgent, important, or fyi.';
comment on table message_alerts is 'A reminder that an urgent message is still waiting for a parent after 2 hours.';
comment on column message_alerts.kind is 'escalation, or a digest mark for one message.';
comment on column message_alerts.member_id is 'The parent who has not ticked yet.';
comment on table digest_marks is 'Stops the 7pm and Sunday digests from being recorded more than once a day.';
comment on column messages.sender is 'Who sent the school message.';
comment on column messages.please_check is 'True when the sorter was unsure and moved the message up one tier.';
comment on function restore_message(uuid) is 'Puts an archived message back in the inbox.';
