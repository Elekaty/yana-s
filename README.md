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

## Local

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is not committed.

In Supabase: **Authentication → URL configuration**. Set Site URL to `http://localhost:3000` while developing, and add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR-APP.vercel.app/auth/callback`

Apply `supabase/migrations/0001_core.sql` in the Supabase SQL editor (or `npx supabase db push` after `supabase link`). For homework scans, also apply `supabase/migrations/0002_scan_types.sql`. For Yana's homework and the break timer, apply `supabase/migrations/0003_homework_play.sql`. Then:

```bash
npm run seed
npm run lint
npm run typecheck
npm test
```

## Vercel

Import `Elekaty/yana-s`. Add the same variables as `.env.example` in Project Settings → Environment Variables. Do not commit `.env.local`. Redeploy after saving them.
