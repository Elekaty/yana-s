# Mochi & Friends

A private app for two parents and Yana. Parents can sign in, and a homework photo becomes an English card.

## Demo

1. Open the site and enter a parent email. Open the link in the same browser.
2. Create the family, type your name, Yana's name, and a 4 to 6 digit PIN.
3. On Setup, copy the invite code.
4. In a private window, sign in as the other parent and choose **Join with a code**.
5. Open **Parents**. The PIN is required. Kid mode locks the parent area again.
6. Kid screens are in French (switch to English on Setup). They do not show the inbox.
7. Open `/dev/mochi` to see Mochi's states in the salon.
8. Open Scan, photograph a worksheet, and wait for the English card. A bad photo stays saved and offers Retry.
9. Open Kid mode. Home shows Mochi. Homework walks through the scanned steps, with hints, and remembers the place after a refresh. The break screen stays up until a parent enters the PIN.
10. On Setup, register the Telegram webhook, send `/link` and the family code in the class group, and add the teacher's email. A forwarded email and a group photo each show up in Inbox. The same item sent twice is stored once. If a reading fails, the original stays with **Could not read, open original.**
11. In Inbox, both parents press **I've seen this**. Archive stays off until the second tick. Undo works before that second tick. An urgent message still waiting after 2 hours is marked **Still waiting for a parent.**

School mail uses `scripts/email-worker.js` on Cloudflare Email Routing. Point the family address (`invite-code@your-domain`) at that worker. Supabase `pg_cron` and `pg_net` should call the job worker every minute, because Vercel Hobby cron only runs daily:

```sql
select cron.schedule(
  'run-jobs',
  '* * * * *',
  $$select net.http_post(
    url := 'https://YOUR-APP.vercel.app/api/jobs/run',
    headers := '{"Authorization":"Bearer YOUR_CRON_SECRET"}'::jsonb
  )$$
);
```

## Local

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is not committed.

In Supabase: **Authentication → URL configuration**. Set Site URL to `http://localhost:3000` while developing, and add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR-APP.vercel.app/auth/callback`

Apply these files in the Supabase SQL editor, in order: `supabase/migrations/0001_core.sql`, `0002_scan_types.sql`, `0003_homework_play.sql`, and `0004_intake.sql`. Then:

```bash
npm run seed
npm run lint
npm run typecheck
npm test
```

## Vercel

Import `Elekaty/yana-s`. Add the same variables as `.env.example` in Project Settings → Environment Variables. Do not commit `.env.local`. Redeploy after saving them.
