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
10. On Setup, register the Telegram webhook, send `/link` and the family code in the class group, and add the teacher's email. If that group refuses bots, run `workers/telegram-userbot` instead and set `USERBOT_WEBHOOK_SECRET` on Vercel. A forwarded email and a group photo each show up in Inbox. The same item sent twice is stored once. If a reading fails, the original stays with **Could not read, open original.**
11. In Inbox, both parents press **I've seen this**. Archive stays off until the second tick. Undo works before that second tick. An urgent message still waiting after 2 hours is marked **Still waiting for a parent.**
12. On a message, press **Add to calendar**, check the date, and save it. On Calendar, snooze the reminder by 30, 45, or 60 minutes, or a custom number. After the third snooze it moves to the next morning. Toussaint and the other 2026–2027 holidays show on the month. **Break plan** adds short practice days during a holiday.
13. On Setup, upload a roster photo, press **Read the roster**, edit any day, then press **Confirm**. Flying days show on the calendar only after that. Tonight, under Parents, names who is free. **Swap** changes the leader. A session never runs longer than the daily cap.
14. In Kid mode, open Games, then the bay. Play Bulles, then Fruits on Easy. Five right answers add 2 stars. There are no lives.
15. In Kid mode, open Games, then Say it. Practice walks through listen, whisper, say, say to Mochi, and record. What's new asks one French question. Stories can be heard page by page. A finished phrase or story adds 2 stars, and nothing is graded. On Progress, a parent can react with a thumbs-up, a heart, or a star. Yana sees that reaction in My album.
16. In Kid mode, open Games. The bay leads to Kitchen and Word Safari. Lagoon, drawing, and Frère Jacques are on the other islands. Five right kitchen orders, five animals, a cleared lagoon level, or the finished song each add 2 stars. The Store can ask for a reward. The town spends stars only when a plot is bought. On Stories, a story hub asks a parent before it opens in a new tab.
17. On To do, edit this month's plan, add a line, and tick one. The shared outline stays for other families. On Progress, set a skill to Strong, add a reward, and approve or deny a request. Approving spends stars. On Setup, save the study block, the break, the town cap, and the tables.
18. Use the app for a week and note what annoys you. On a kid screen, press Tab: the focused control shows a yellow ring, and the lagoon arrows, kitchen foods, and safari animals have names. Ask a French speaker to read `docs/french-notes.md`.

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

In the Supabase SQL editor, run these one at a time: `supabase/migrations/0001_core.sql`, `0002_scan_types.sql`, `0003_homework_play.sql`, `0004_intake.sql`, `0005_inbox.sql`, `0006_calendar.sql`, `0007_roster.sql`, `0008_stories.sql`, `0009_town.sql`, and `0010_plan.sql`. Each file is safe to run again. Then:

```bash
npm run seed
npm run lint
npm run typecheck
npm test
```

## Vercel

Import `Elekaty/yana-s`. Add the same variables as `.env.example` in Project Settings → Environment Variables. Do not commit `.env.local`. Redeploy after saving them.
