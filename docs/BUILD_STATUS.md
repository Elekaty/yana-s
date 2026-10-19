# Build status

Single list for the finish-the-app pass. One task at a time.

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| A1 | Audit and PIN gate | DONE | `src/lib/parent-gate.ts`, `tests/parent-gate.test.ts`, `tests/pin-guard.test.ts` | Signed-in visits to `/parent`, `/parent/inbox`, `/parent/setup` and `/parent/rewards` redirect to `/parent/unlock` without a valid unlock cookie. `/parent/unlock` stays on the PIN form. Opening kid mode clears the cookie. Five wrong PINs lock for 5 minutes. The preview family path is gone. |
| A2 | Apply all migrations | DONE | `supabase/migrations/0012_garden.sql` | The live database already has the tables and `plant_next` from `0001` through `0012`, including `garden_items` and `homework_scans.image_hash`. Nothing new was applied in this pass. |
| B1 | School calendar and break mode | DONE | `src/lib/plan/tonight.ts`, `src/lib/prizes.ts`, `src/lib/study/clock.ts`, `tests/plan.test.ts` | On a holiday the plan is 10 minutes at 10:00 and names nobody. The on-time bonus waits, a holiday weekday still allows a perfect week, and the break timer does not count. A missing scan says no scan is needed. The break-plan button was already on the calendar. |
| B2 | Study block and break timer | DONE | `src/lib/study/clock.ts`, `src/components/kid/break-gate.tsx`, `src/components/kid/homework-player.tsx`, `tests/study.test.ts` | The homework bar follows the live clock and names the study length and the time until the break. A heads-up can add 5 or 10 minutes, twice. The break covers the screen until it ends, then awards 1 star. A song makes Mochi dance. Bubbles do not score. A parent skips only with the PIN. A school holiday still pauses the timer. |
| B3 | On-time bonus and study chests | DONE | `src/lib/prizes.ts`, `src/app/kid/actions.ts`, `tests/prizes.test.ts` | A check-in in the evening window awards the daily stars, and five days award two fives. Active study opens up to three chests a day. Star chests use `award_stars`. |
| B3b | Six characters | DONE | `src/lib/mochi/friends.ts`, `src/app/kid/games/friends/page.tsx`, `tests/mochi-crew.test.ts` | My friends shows Mochi, Praline, Bambou, Roux, Biscuit, and Noisette. Mochi and Praline are there from the start, each with a short line. The other four stay silhouettes, with no name, until she meets them. |
| B4 | Town purchases | DONE | `src/lib/games/town.ts`, `src/app/kid/town/page.tsx`, `supabase/migrations/0009_town.sql`, `tests/islands.test.ts` | The garden opens the town after a parent turns the building shop on. A buy spends the listed price through `buy_town_item`. Too few stars, a parent cap, or a filled plot is refused. Twelve plots celebrate. A tap says the French name. Praline strolls from the start. A clock save waits until the previous one finishes. |
| B5 | Thirty stories | DONE | `src/lib/stories/library.ts`, `src/app/kid/games/stories/page.tsx`, `tests/voice.test.ts` | Thirty original stories, each with a French line and an English line. The list follows that order and shows which one of the thirty she is on. Écoute reads the page. Suivant turns the page, then says a parent can mark that she read it. |
| B6 | Store and reward vault | DONE | `src/app/parent/(gate)/rewards/page.tsx`, `src/app/kid/store/page.tsx`, `tests/rewards.test.ts` | A parent adds a prize, Yana asks, and approval spends exactly the cost. The live check is in the database test. |
| C1 | Telegram and email intake | TODO | | |
| C2 | Inbox and two-tick archive | TODO | | |
| C3 | To do and calendar events | TODO | | |
| C4 | Reminders and snooze | TODO | | |
| C5 | Roster and Tonight plan | TODO | | |
| C6 | Progress and weekly digest | TODO | | |
| C7 | Settings and guest link | TODO | | |
| D1 | Homework scan pipeline | TODO | | |
| D2 | Games audit | TODO | | |
| D3 | Voice zone | TODO | | |
| D4 | Mochi and the salon | TODO | | |
| E1 | Accessibility and performance | TODO | | |
| E2 | French review prep | TODO | | |
| E3 | Final audit | TODO | | |

## Review

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| R0 | Verify and audit | DONE | `docs/AUDIT.md` | Unsigned `/parent/**` returns 307 to `/login` locally and on production. Four parent pages are stubs. |
| R1 | Route protection | DONE | `src/lib/parent-gate.ts`, `src/lib/parent/guard.ts`, `tests/parent-gate.test.ts` | Every parent page redirects to `/login` when signed out, and each page calls `requireParent()`. Unsigned scan APIs are denied. Webhook and calendar-feed routes keep their own secrets. |
| R2 | Accounts | DONE | `src/lib/login-guard.ts`, `src/app/join/page.tsx`, `src/app/parent/(gate)/setup/password-actions.ts`, `tests/accounts.test.ts` | Names stay unique. Five wrong sign-ins lock for 5 minutes. A remembered session lasts 30 days. The second parent creates an account, then joins with the family code. Setup lists parents and can set the other parent's password with the PIN. |
| R3 | Migrations, seed and checklist | DONE | `src/lib/calendar/seed.ts`, `src/lib/plan/seed.ts`, `src/app/parent/(gate)/setup/status/page.tsx`, `tests/calendar.test.ts` | Calendar fills the 2026-2027 school dates. Progress fills the shared skills and monthly plan. The checklist names tables through 0011 and only mentions a missing table when one is missing. |
| R4 | Curriculum | DONE | `src/app/parent/(gate)/curriculum/page.tsx`, `tests/outline.test.ts` | Curriculum shows the November plan, edit and add, the break-plan button, game tables, and skills. A tables round raises that skill and does not lower a Strong mark. |
| R5 | Today summary | DONE | `src/app/parent/(gate)/page.tsx`, `src/lib/parent/today.ts`, `tests/parent-today.test.ts` | Today shows Needs you, Tonight, and Homework in a compact group, then the later blocks only when they have something to show. |
| R6 | Intake and Inbox | DONE | `src/app/parent/(gate)/inbox/page.tsx`, `src/app/api/intake/telegram/route.ts`, `src/app/api/intake/email/route.ts`, `tests/inbox.test.ts` | Inbox filters, 30/45/60 snooze, and archive only after both parents tick. A saved note gets a tier immediately. Real Telegram and forwarded email were not sent in this pass. |
| R7 | Calendar, to do, reminders | DONE | `src/app/parent/(gate)/calendar/page.tsx`, `src/app/parent/(gate)/todo/page.tsx`, `src/lib/calendar/due.ts`, `tests/calendar.test.ts` | Month grid, add and remove, chosen reminders, to-do snooze and reassign. A due reminder is sent to the linked Telegram chat and to a subscribed phone. A live fire and a Telegram snooze were not watched. |
| R8 | Scan, cache and homework | DONE | `src/lib/scan/process.ts`, `src/lib/scan/cache.ts`, `src/components/scan/desk.tsx`, `tests/scan.test.ts` | The same photo copies the saved reading and does not call Gemini again. The brief shows up to three coaching questions. Homework keeps hints, read-aloud, the focus bar, and the 15-minute break. A real photo was not scanned twice in this pass. |
| R9 | Store, rewards and automatic prizes | DONE | `src/app/parent/(gate)/rewards/page.tsx`, `src/lib/prizes.ts`, `tests/rewards.test.ts`, `tests/rls.integration.test.ts` | The vault lists prizes, requests, and the balance. Approval spends exactly the cost. Check-in and study chests award stars through `award_stars`. A chest can also be a sticker, a dance, or a friend. |
| R10 | Kid experience and Mochi | DONE | `src/components/mochi/Mochi.tsx`, `src/lib/mochi/machine.ts`, `src/components/mochi/salon.tsx`, `tests/mochi-machine.test.ts` | The salon cat is the layered drawing: blink, breath, ears, tail, and one action at a time. Friends, stories behind the parent PIN, the town, voice, and the games are reachable. A phone layout and a performance trace were not run. |
| R11 | Quality | DONE | `tests/quality.test.ts`, `.github/workflows/check.yml`, `src/app/parent/(gate)/voice/page.tsx`, `src/app/parent/(gate)/study/page.tsx` | Every parent and kid route is checked signed out, and a parent without the PIN is sent to unlock. Voice and Study render their own data. A page error is logged in the console. Playwright and a phone Lighthouse run were not done. |

## Parent views

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| P1 | Shell, navigation and data layer | DONE | `src/components/parent/parent-nav.tsx`, `src/lib/parent/queries.ts` | Today, Inbox, Calendar, Progress, and More. Scan lives at `/parent/scan`. Curriculum, Voice, Study, and Rewards render. |
| P2 | Today summary | DONE | `src/app/parent/(gate)/page.tsx`, `tests/parent-today.test.ts` | Blocks 1 to 9. Empty optional lists stay hidden. The first three sit in one compact group. |
| P3 | Inbox | DONE | `src/app/parent/(gate)/inbox/page.tsx`, `tests/inbox.test.ts` | Filters, two-tick archive, undo, tier change, and the archive folder. |
| P4 | Calendar | DONE | `src/app/parent/(gate)/calendar/page.tsx`, `tests/calendar.test.ts` | Month grid, holiday bands, add and remove, and the reminder choice from a message. |
| P5 | To do | DONE | `src/app/parent/(gate)/todo/page.tsx` | Open tasks link back to the school message. Done, snooze, and reassign. |
| P6 | Progress and Curriculum | DONE | `src/app/parent/(gate)/progress/page.tsx`, `src/lib/parent/progress.ts`, `tests/progress-view.test.ts` | The week shows study minutes, stars earned, and hints. She read it awards the story once. Suggested skills link to Curriculum. The weekly note can be sent to Telegram. Sunday does not send it on its own, and email is not connected. |
| P7 | Rewards and Voice | DONE | `src/app/parent/(gate)/rewards/page.tsx`, `src/app/parent/(gate)/voice/page.tsx` | Approving a request spends the cost. Voice plays a recording and can react. |
| P8 | Study and Setup | DONE | `src/app/parent/(gate)/study/page.tsx`, `src/app/parent/(gate)/setup/page.tsx` | Study saves the block, the break, and the prize caps. Setup still shows the family, Telegram, and email fields. |
| P9 | Notifications | DONE | `src/lib/inbox/escalate.ts`, `src/lib/notify/copy.ts`, `src/lib/calendar/due.ts`, `tests/inbox.test.ts` | An urgent note alerts both parents once. The 7pm and Sunday digests send text, and Sunday adds a progress line. Reminder buttons are Done, 30, 45, 60, and Custom. Custom only says to open the app. A live Telegram message and a snooze tap were not watched. |
| P10 | Quality | DONE | `e2e/parent-routes.mjs`, `src/lib/parent/list-states.ts`, `tests/quality.test.ts` | Signed out, every parent route ends on the family form and shows no parent list. Without the PIN, every route stays on the unlock form. With the PIN, every route renders. Keyboard focus, contrast, reduced motion, a wide layout, and dark mode passed on a phone-sized browser. Lighthouse on the local dev server, phone profile, scored performance 43 and accessibility 100 for `/parent`. That run was not production and not CI. |

## A1 route check

Migrations on disk: `0001_core` through `0012_garden`. The live database already has those tables.

Parent pages live under `src/app/parent/(gate)/`, so they share the parent header. `/parent/unlock` is outside that folder, so it renders only the PIN card. The old preview switch sent `/parent/unlock` to `/parent`, which is why the parent screens appeared there. That switch is removed.

Unsigned requests to `/parent` and `/parent/unlock` still go to `/login` first. A signed-in parent without the cookie goes to the PIN page.
