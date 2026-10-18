# Audit

Reviewed from the code. Parent pages require a signed-in parent and a valid PIN cookie. There is no preview family.

| Route or feature | Status | Reason |
| --- | --- | --- |
| `/` | working | Signed-out visitors go to login, unless demo mode is explicitly on outside production. |
| `/login` | working | Email and password. Remember this device. |
| `/join` | working | Create or join a family after sign-in. The invite code comes from the database, not the word preview. |
| `/parent/unlock` | working | PIN screen. Five wrong tries lock it for 15 minutes. The unlock cookie lasts 12 hours. |
| `/parent` Scan | working | Needs a signed-in parent and the PIN. |
| `/parent/inbox` | working | Empty until a message arrives. Setup can send a test note. Two-tick archive is in SQL. A real Telegram or email delivery was not sent from here. |
| `/parent/calendar` | working | Month grid and national holidays when `0006` is applied. The old “paste 0006” line is now a checklist link. |
| `/parent/todo` | working | Monthly plan when `0010` is applied. |
| `/parent/progress` | working | Skill outline, rewards, voice reactions. |
| `/parent/rewards` | working | Opens Progress, where rewards are added and approved. The stub sentence is gone. |
| `/parent/setup` | working | Invite code, Telegram webhook button, senders, roster, practice. |
| `/parent/setup/status` | working | Checklist of env names and tables. It does not print secret values, and it cannot see whether Supabase cron is actually firing. |
| Kid home, salon, games | working | Same parent session, no PIN. Mochi’s moves are on Home. |
| Games hub | working | Bay, Lagoon, Cove, Stories, My friends, Town. |
| Store | working | Lists rewards when a parent has added one. Otherwise it asks Yana to ask a parent. |
| Break timer, Gemini scan, push | needs env var | The screens exist. A live scan, a push on a phone, and the break timer were not exercised in this pass. |
| Study chest and on-time bonus | working | Home has “I’m here” during the family’s evening window. Active study opens a chest. Both pay through `award_stars` (1–5; a perfect week is two calls of 5). Idle time does not count. |
| Salon cat | working | Layered SVG in the living room. The split-part motion build is the next step. |
| Reading log and plan tags | working | Progress lists finished stories. To do shows National, Typical, or Yours. |
| Repeated homework photo | working | `0011_scan_cache.sql` stores a hash. The same photo returns the saved reading and does not call Gemini. Run that SQL once in the Supabase editor. |
| Parent PIN | working | `/parent` without the unlock cookie goes to `/parent/unlock`. Five wrong tries lock for 5 minutes. Kid mode clears the cookie. |

## Environment names the app reads

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `USERBOT_WEBHOOK_SECRET`, `INBOUND_EMAIL_SECRET`, `INBOUND_EMAIL_DOMAIN`, `CRON_SECRET`, `APP_URL`, `INTAKE_URL`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`, `TARGET_CHAT_ID`, `VERCEL_RECEIVER_URL`, `FAMILY_INVITE_CODE`.

This audit cannot see the Vercel project’s saved values. The checklist page shows which of the server names are non-empty after deploy.

## Migrations

`supabase/migrations/0001_core.sql` through `0010_plan.sql`. They are written to be re-run. Whether each one is applied is visible on Setup checklist as Present or Missing for messages, school calendar, skills, plan items, rewards, and roster drafts. This pass did not run `supabase db push`.
