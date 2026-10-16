# Free-tier limits

Checked 16 October 2026. Confirm again before a step that depends on a limit.

## Supabase Free

Source: [supabase.com/pricing](https://supabase.com/pricing) and [billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase).

- $0. Two active free projects. A project pauses after 1 week with no activity.
- 500 MB database, 1 GB file storage, 5 GB egress, 50,000 monthly active users.
- Auth emails sent by Supabase are rate-limited. For daily use, add your own SMTP later if the built-in mailer is not enough.
- The service role key bypasses row-level security. It stays in `.env.local` and in Vercel, never in the browser.

## Vercel Hobby

Sources: [Cron jobs usage](https://vercel.com/docs/cron-jobs/usage-and-pricing) and [Functions limits](https://vercel.com/docs/functions/limitations), checked 16 October 2026.

- Hobby cron jobs run at most once per day, and the time can be up to an hour off. That is why the job worker will be triggered by Supabase `pg_cron`, not by Vercel Cron. Confirm `pg_cron` and `pg_net` on this project before Step 4.
- A function request or response can be at most 4.5 MB. Homework photos are compressed to about 300–500 KB on the phone and uploaded straight to Supabase Storage, so the scan request to Vercel is only the file path.
- Hobby is for personal, non-commercial use.

## Gemini

The scan uses Gemini Flash (`gemini-3.8-flash`, then `gemini-2.5-flash` if that model is missing) with JSON output. The daily quota for this key is shown in Google AI Studio and changes, so it is not copied here. The prompt does not include the child's name, the parents' names, or an address. The photo is sent only after a parent chooses Scan.

## Not used yet

Telegram Bot API, Cloudflare Email Routing, and web push are wired as environment variables only. Their free limits get recorded in the step that turns them on.

## Voice

`speechSynthesis` quality depends on the phone. French may sound uneven until reviewed audio files replace it. The `speak()` function is the only place that needs to change.
