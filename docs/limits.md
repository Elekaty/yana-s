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

The scan uses Gemini Flash (`gemini-3.8-flash`, then `gemini-2.5-flash` if that model is missing) with JSON output. The daily quota for this key is shown in Google AI Studio and changes, so it is not copied here. The prompt does not include the child's name, the parents' names, or an address. A homework photo is sent only after a parent chooses Scan. A roster photo or PDF is sent only after a parent uploads it on Setup, and only the days are stored.

## Telegram

The Bot API is free. `getFile` can download a file up to 20 MB; this app stores files up to 8 MB. The webhook checks `X-Telegram-Bot-Api-Secret-Token`. Photos are saved in private storage and are not sent to Gemini unless a parent presses **Read this photo**.

## Email

Sources: [Email Routing limits](https://developers.cloudflare.com/email-service/platform/limits/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), checked 16 October 2026.

- Inbound Email Routing is free and unlimited. A message can be up to 25 MB. 200 routing rules per domain.
- The worker in `scripts/email-worker.js` runs on the Workers free plan: 100,000 requests a day and about 10 ms of CPU. It forwards only the first 200 KB, and the app then reads the plain-text part. A long attachment can be cut off. The Vercel function body limit is still 4.5 MB.

## Not used yet

Web push is an environment variable only. Its free limit is recorded in the step that turns it on.

## Voice

`speechSynthesis` quality depends on the phone. French may sound uneven until reviewed audio files replace it. The `speak()` function is the only place that needs to change. Recordings stay in the private `voice` bucket. They are not sent to Gemini.
