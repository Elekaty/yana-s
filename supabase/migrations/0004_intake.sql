-- 0004 intake
-- Links a Telegram chat and the allowed school emails. Descriptions show in the Supabase table editor.

alter table messages add column if not exists content_hash text;
alter table messages add column if not exists read_status text not null default 'saved';

alter table messages drop constraint if exists messages_read_status_check;
alter table messages add constraint messages_read_status_check
  check (read_status in ('saved', 'reading', 'ready', 'failed'));

create unique index if not exists messages_content_hash_idx
  on messages (family_id, content_hash)
  where content_hash is not null;

create table if not exists telegram_chats (
  chat_id text primary key,
  family_id uuid not null references families(id) on delete cascade,
  title text,
  linked_at timestamptz not null default now()
);

create table if not exists allowed_senders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  email text not null,
  unique (family_id, email)
);

alter table telegram_chats enable row level security;
alter table allowed_senders enable row level security;

drop policy if exists telegram_chats_select on telegram_chats;
create policy telegram_chats_select on telegram_chats for select to authenticated
  using (is_member(family_id));

drop policy if exists allowed_senders_all on allowed_senders;
create policy allowed_senders_all on allowed_senders for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

grant select on telegram_chats to authenticated;
grant select, insert, update, delete on allowed_senders to authenticated;

comment on column messages.content_hash is 'Fingerprint of the note. The same text or photo is stored once.';
comment on column messages.read_status is 'saved, reading, ready, or failed. Failed means: could not read, open the original.';
comment on table telegram_chats is 'Class or parent chats linked with /link and the family code.';
comment on column telegram_chats.chat_id is 'The Telegram chat id. Group ids are negative.';
comment on column telegram_chats.title is 'The chat name at the time it was linked.';
comment on table allowed_senders is 'School email addresses this family accepts. Other senders are ignored.';
comment on column allowed_senders.email is 'The sender address, stored in lower case.';
