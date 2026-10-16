-- Telegram chats, allowed school senders, and a hash so the same note is stored once.

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

create policy telegram_chats_select on telegram_chats for select to authenticated
  using (is_member(family_id));

create policy allowed_senders_all on allowed_senders for all to authenticated
  using (is_member(family_id)) with check (is_member(family_id));

grant select on telegram_chats to authenticated;
grant select, insert, update, delete on allowed_senders to authenticated;
