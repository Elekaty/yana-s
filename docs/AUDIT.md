# Audit

18 Oct 2026. R0 recorded the routes. R1 then added `requireParent()` on every parent page and a 401 from the gate for unsigned `POST /api/scans` and `POST /api/scans/:id/retry`. Webhook and calendar-feed routes are unchanged. The signed-out page results below still hold.

`docs/BUILD_PLAN_V2.md`, `docs/MOCHI_BLUEPRINT.md`, and `docs/REVIEW_2.md` are not in the repo. This pass follows the R0 line from the review prompt: run the app, mark every route, and record whether each `/parent/**` URL is reachable with no session.

## How this was checked

Unsigned requests, no cookies, redirects not followed.

- Local: the Next.js dev server already running for this project at `http://127.0.0.1:3000`.
- Production: `https://yana-s.vercel.app`.

Playwright is not installed, and this pass did not add it. There was no signed-in browser session, so a parent or kid page was not opened after the PIN. For routes that redirect, the status below is the page that would render after sign-in, read from the route module. The signed-out column is the HTTP result from both hosts, which matched on every route.

An unknown path, `/parent/missing`, also returned 307 to `/login` on both hosts. The gate runs before a missing parent URL can show a 404.

## Signed out: every `/parent/**` route

None of these is reachable without a session. Each returned **307** to `/login` locally and on Vercel. The Vercel redirect is `cache-control: public, max-age=0, must-revalidate`, so this pass did not receive a cached copy of a parent page.

| Route | Reachable signed out |
| --- | --- |
| `/parent` | No. 307 `/login` |
| `/parent/unlock` | No. 307 `/login` |
| `/parent/inbox` | No. 307 `/login` |
| `/parent/calendar` | No. 307 `/login` |
| `/parent/calendar/confirm` | No. 307 `/login` |
| `/parent/todo` | No. 307 `/login` |
| `/parent/progress` | No. 307 `/login` |
| `/parent/setup` | No. 307 `/login` |
| `/parent/setup/status` | No. 307 `/login` |
| `/parent/scan` | No. 307 `/login` |
| `/parent/curriculum` | No. 307 `/login` |
| `/parent/voice` | No. 307 `/login` |
| `/parent/study` | No. 307 `/login` |
| `/parent/rewards` | No. 307 `/login` |

`/kid` and every `/kid/**` route below also returned 307 to `/login`. `/join` did too.

## Routes

| Route | Status | Signed out | What this pass found |
| --- | --- | --- | --- |
| `/` | working | 307 `/login` | Signed-in code sends a parent with a family to `/kid/home`, and a parent with no family to `/join`. |
| `/login` | working | 200 or redirect | No name, email, or password. A phone opens a private session by itself. Parent screens still ask for the PIN. |
| `/join` | working | 307 `/login` | Create-or-join form after sign-in. Not opened in this pass. |
| `/parent` | working | 307 `/login` | Today shows three sections from one data load: messages waiting, tonight’s line, homework status and a link to Scan. Coming up, the break banner, the week, rewards, recordings, and setup health are loaded and not drawn. |
| `/parent/unlock` | working | 307 `/login` | PIN card. Five wrong tries lock for 5 minutes. The unlock cookie lasts 12 hours. Not submitted in this pass. |
| `/parent/inbox` | working | 307 `/login` | List, archive folder, ticks, tier, remind, add to calendar, and archive actions are in the page. No live Telegram or email message was sent. |
| `/parent/calendar` | working | 307 `/login` | Month grid. `school_calendar` answers. Not opened after sign-in. |
| `/parent/calendar/confirm` | working | 307 `/login` | Confirm-an-event page. Not opened after sign-in. |
| `/parent/todo` | working | 307 `/login` | Plan lines and add-a-line. `plan_items` answers. Not opened after sign-in. |
| `/parent/progress` | working | 307 `/login` | Week counts, skills, rewards, voice reactions, reading log. `skills` answers. Not opened after sign-in. |
| `/parent/setup` | working | 307 `/login` | Invite, Telegram, senders, roster, practice, language. Not opened after sign-in. |
| `/parent/setup/status` | working | 307 `/login` | Checklist of env names and tables. It does not show secret values. Not opened after sign-in. |
| `/parent/scan` | working | 307 `/login` | Scan desk and tonight card. A photo was not uploaded, so Gemini was not called. |
| `/parent/curriculum` | working | 307 `/login` | November plan, edits, game tables, and skills. Not opened after the PIN. |
| `/parent/voice` | working | 307 `/login` | Loads Yana's recordings, with a player and 👍 ❤️ 🌟. Empty copy says they come from Say it and are never graded or sent to an AI. Not opened after the PIN. |
| `/parent/study` | working | 307 `/login` | Study block, break, warning, postponements, on-time stars, chests, play cap, and town cap. Saving writes the family settings the kid timer reads. Not opened after the PIN. |
| `/parent/rewards` | working | 307 `/login` | New prize, requests with Approve and Not now, the vault with Remove, and the balance. Not opened after the PIN. |
| `/kid/home` | working | 307 `/login` | Salon home, stars, check-in. Not opened after sign-in. |
| `/kid/homework` | working | 307 `/login` | Player when a ready scan has a task. Otherwise the empty homework card. Not opened after sign-in. |
| `/kid/games` | working | 307 `/login` | Hub: Bay, Lagoon, Cove, Stories, My friends, Town. |
| `/kid/games/bay` | working | 307 `/login` | Bubbles, fruit, and more. |
| `/kid/games/bay/bulles` | working | 307 `/login` | Bubble game page. Not played. |
| `/kid/games/bay/fruit` | working | 307 `/login` | Fruit game page. Not played. |
| `/kid/games/bay/more` | working | 307 `/login` | Kitchen, safari, say-it links. |
| `/kid/games/bay/kitchen` | working | 307 `/login` | Kitchen game page. Not played. |
| `/kid/games/bay/safari` | working | 307 `/login` | Safari game page. Not played. |
| `/kid/games/lagoon` | working | 307 `/login` | Arrow-path game page. Not played. |
| `/kid/games/cove` | working | 307 `/login` | Draw and music links. |
| `/kid/games/cove/draw` | working | 307 `/login` | Draw page. Not used. |
| `/kid/games/cove/music` | working | 307 `/login` | Music page. Not used. |
| `/kid/games/stories` | working | 307 `/login` | Story list, or a short empty line if none are stored. Outside stories ask for the parent PIN. `stories` answers. |
| `/kid/games/stories/chat-lune` | working | 307 `/login` | One story route. Not opened after sign-in. |
| `/kid/games/friends` | working | 307 `/login` | Friend collection. `friends_unlocked` answers. |
| `/kid/games/voice` | working | 307 `/login` | Say-it hub. |
| `/kid/games/voice/practice` | working | 307 `/login` | Practice page. Not recorded. |
| `/kid/games/voice/new` | working | 307 `/login` | What’s-new page. Not recorded. |
| `/kid/games/voice/album` | working | 307 `/login` | Album page. Empty copy says nothing is recorded yet. `voice_recordings` answers. |
| `/kid/town` | working | 307 `/login` | Town board. If the plots query fails, the page says the town is not ready. `town_plots` answers. |
| `/kid/store` | working | 307 `/login` | Lists active rewards, or asks Yana to ask a parent. `rewards` answers. |
| `/dev/mochi` | working | **200, reachable** | Salon state lab. It is outside the parent and kid gate, on local and on production. |
| `/manifest.webmanifest` | working | 200 | PWA manifest. |
| `/sw.js` | working | 200 | Service worker script. |
| `/icon.svg` | working | 200 | Icon. |
| `POST /api/intake/telegram` | working | 401 | Rejects a body with no webhook secret. A real Telegram update was not sent. |
| `POST /api/intake/email` | working | 401 | Rejects a body with no inbound secret. A real forwarded email was not sent. |
| `POST /api/intake/userbot` | working | 401 | Rejects a body with no userbot secret. |
| `POST /api/jobs/run` | working | 401 | Rejects a parent-less call. Cron firing was not watched. |
| `POST /api/scans` | working | 401 | Rejects a parent-less call. No photo was posted. |
| `POST /api/scans/00000000-0000-0000-0000-000000000000/retry` | working | 401 | Rejects a parent-less call. |
| `GET /api/calendar/not-a-uuid` | working | 404 | Bad token shape. |
| `GET /api/calendar/00000000-0000-0000-0000-000000000000` | working | 404 | Well-formed token that matches no family. A real family feed was not requested. |
| `GET` on the POST-only API routes | working | 405 | Those six routes do not answer GET. |

No route returned 500. No route is marked broken. Voice, Study, and Curriculum render their own data. The tables this pass asked for are present (below).

## Tables

Asked with the server key, one column, no row contents kept. HTTP 200 means the column is there.

| Table | Column | Result |
| --- | --- | --- |
| `messages` | `id` | 200 |
| `message_acks` | primary key `(message_id, member_id)` | Table is present. It has no `id` column. |
| `school_calendar` | `id` | 200 |
| `skills` | `skill_key` | 200 |
| `plan_items` | `item_key` | 200 |
| `rewards` | `id` | 200 |
| `roster_drafts` | `id` | 200 |
| `homework_scans` | `image_hash` | 200 |
| `stories` | `slug` | 200 |
| `town_plots` | `slot` | 200 |
| `friends_unlocked` | `friend` | 200 |
| `voice_recordings` | `id` | 200 |
| `jobs` | `id` | 200 |
| `telegram_chats` | `chat_id` | 200 |

Migrations `0001` through `0011` are in the repo. The shared school dates, skills, and monthly plan are already stored: 11 national dates, 23 skills, and 20 plan lines. Opening Calendar or Progress fills any of those that are missing. `supabase db push` was not run in this pass. `pg_cron` was not checked.

## Environment names on this machine

Present or empty in the local env files only. Vercel’s saved values were not visible. No values are written here.

| Name | Local file |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | present |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | present |
| `SUPABASE_SERVICE_ROLE_KEY` | present |
| `GEMINI_API_KEY` | present |
| `TELEGRAM_WEBHOOK_SECRET` | present |
| `INBOUND_EMAIL_SECRET` | present |
| `CRON_SECRET` | present |
| `APP_URL` | present, host `yana-s-ele18.vercel.app` |
| `INTAKE_URL` | present |
| `VAPID_PUBLIC_KEY` | present |
| `VAPID_PRIVATE_KEY` | present |
| `VERCEL_RECEIVER_URL` | present |
| `TELEGRAM_BOT_TOKEN` | empty |
| `USERBOT_WEBHOOK_SECRET` | empty |
| `INBOUND_EMAIL_DOMAIN` | empty |
| `TELEGRAM_API_ID` | empty |
| `TELEGRAM_API_HASH` | empty |
| `TELEGRAM_SESSION_STRING` | empty |
| `TARGET_CHAT_ID` | empty |
| `FAMILY_INVITE_CODE` | empty |

`https://yana-s-ele18.vercel.app/login` returned **404**. The live login page is `https://yana-s.vercel.app/login`.

## Not verified

Signed-in layout at 390px and 1024px, light and dark. A real Telegram message, a real forwarded email, push on a phone, a Gemini scan, cron firing, and a signed-in look at Today, Inbox, Calendar, To do, Progress, and the kid games. R5 added the Today blocks in code. R6 added Inbox filters and snooze choices. R7 added calendar add and remove, and reminder delivery in code. R8 copies a repeated homework photo instead of calling Gemini again. R9 puts prizes, requests, and the balance on Rewards. R10 draws the layered cat in the salon and keeps story links behind the parent PIN. This audit did not open them after the PIN, and it did not send a real Telegram message, a real forwarded email, watch a reminder fire, or scan a real photo twice. It also did not measure animation on a phone. R11 fills Voice and Study, logs a page error in the console, and checks every parent and kid route in `tests/quality.test.ts`. Playwright was not installed. A phone Lighthouse run was not done. Visiting those routes from here would open a new device account.
