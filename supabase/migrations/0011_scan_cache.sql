-- 0011 scan cache
-- Remember a homework photo so the same picture is not sent to Gemini twice.
-- Descriptions show under the column name in the Supabase table editor.

alter table homework_scans add column if not exists image_hash text;

create index if not exists homework_scans_image_hash_idx
  on homework_scans (family_id, image_hash);

comment on column homework_scans.image_hash is 'SHA-256 of the photo. A later upload with the same hash reuses the saved reading.';
