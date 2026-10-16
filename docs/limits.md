# Free-tier limits

Checked 16 October 2026. Confirm again before a step that depends on a limit.

## Supabase Free

Source: [supabase.com/pricing](https://supabase.com/pricing) and [billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase).

- $0. Two active free projects. A project pauses after 1 week with no activity.
- 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users.
- Auth emails sent by Supabase are rate-limited. For daily use, add your own SMTP later if the built-in mailer is not enough.
- The service role key bypasses row-level security. It stays in `.env.local` and in Vercel, never in the browser.

## Vercel Hobby

Source: [Cron jobs usage](https://vercel.com/docs/cron-jobs/usage-and-pricing).

- Hobby cron jobs run at most once per day, and the time can be up to an hour off. That is why the job worker will be triggered by Supabase `pg_cron`, not by Vercel Cron. Confirm `pg_cron` and `pg_net` on this project before Step 4.
- Hobby is for personal, non-commercial use.

## Gemini

Quotas change and are shown in Google AI Studio for the key you create. Do not copy a number from memory. Step 2 will record the Flash limit that applies to this key, and the photo upload must stay under Vercel's request body limit (check the current Hobby limit in the Vercel docs at that step).

## Not used yet

Telegram Bot API, Cloudflare Email Routing, and web push are wired as environment variables only. Their free limits get recorded in the step that turns them on.

## Voice

`speechSynthesis` quality depends on the phone. French may sound uneven until reviewed audio files replace it. The `speak()` function is the only place that needs to change.
