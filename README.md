# Mochi & Friends

A private app for two parents and Yana. This repository is at Step 1: sign-in, one family, a parent PIN, and Mochi in the salon.

## Demo

1. Open the site and enter a parent email. Open the link in the same browser.
2. Create the family, type your name, Yana's name, and a 4 to 6 digit PIN.
3. On Setup, copy the invite code.
4. In a private window, sign in as the other parent and choose **Join with a code**.
5. Open **Parents**. The PIN is required. Kid mode locks the parent area again.
6. Kid screens are in French (switch to English on Setup). They do not show the inbox.
7. Open `/dev/mochi` to see Mochi's states in the salon.

## Local

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is not committed.

In Supabase: **Authentication → URL configuration**. Set Site URL to `http://localhost:3000` while developing, and add redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://YOUR-APP.vercel.app/auth/callback`

Apply `supabase/migrations/0001_core.sql` in the Supabase SQL editor (or `npx supabase db push` after `supabase link`). Then:

```bash
npm run seed
npm run lint
npm run typecheck
npm test
```

## Vercel

Import `Elekaty/yana-s`. Add the same variables as `.env.example` in Project Settings → Environment Variables. Do not commit `.env.local`. Redeploy after saving them.
