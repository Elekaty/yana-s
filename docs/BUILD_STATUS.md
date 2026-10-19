# Build status

Single list for the finish-the-app pass. One task at a time.

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| A1 | Audit and PIN gate | DONE | `src/lib/parent-gate.ts`, `tests/parent-gate.test.ts`, `tests/pin-guard.test.ts` | Signed-in visits to `/parent`, `/parent/inbox`, `/parent/setup` and `/parent/rewards` redirect to `/parent/unlock` without a valid unlock cookie. `/parent/unlock` stays on the PIN form. Opening kid mode clears the cookie. Five wrong PINs lock for 5 minutes. The preview family path is gone. |
| A2 | Apply all migrations | TODO | | |
| B1 | School calendar and break mode | TODO | | |
| B2 | Study block and break timer | TODO | | |
| B3 | On-time bonus and study chests | TODO | | |
| B3b | Six characters | TODO | | |
| B4 | Town purchases | TODO | | |
| B5 | Thirty stories | TODO | | |
| B6 | Store and reward vault | TODO | | |
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

## Parent views

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| P1 | Shell, navigation and data layer | DONE | `src/components/parent/parent-nav.tsx`, `src/lib/parent/queries.ts` | Today, Inbox, Calendar, Progress, and More. Scan lives at `/parent/scan`. Curriculum, Voice, Study, and Rewards render. |
| P2 | Today summary | DONE | `src/app/parent/(gate)/page.tsx`, `tests/parent-today.test.ts` | Blocks 1 to 9. Empty optional lists stay hidden. The first three sit in one compact group. |
| P3 | Inbox | DONE | `src/app/parent/(gate)/inbox/page.tsx`, `tests/inbox.test.ts` | Filters, two-tick archive, undo, tier change, and the archive folder. |
| P4 | Calendar | DONE | `src/app/parent/(gate)/calendar/page.tsx`, `tests/calendar.test.ts` | Month grid, holiday bands, add and remove, and the reminder choice from a message. |
| P5 | To do | DONE | `src/app/parent/(gate)/todo/page.tsx` | Open tasks link back to the school message. Done, snooze, and reassign. |
| P6 | Progress and Curriculum | TODO | | |
| P7 | Rewards and Voice | TODO | | |
| P8 | Study and Setup | TODO | | |
| P9 | Notifications | TODO | | |
| P10 | Quality | TODO | | |

## A1 route check

Migrations on disk: `0001_core` through `0011_scan_cache`.

Parent pages live under `src/app/parent/(gate)/`, so they share the parent header. `/parent/unlock` is outside that folder, so it renders only the PIN card. The old preview switch sent `/parent/unlock` to `/parent`, which is why the parent screens appeared there. That switch is removed.

Unsigned requests to `/parent` and `/parent/unlock` still go to `/login` first. A signed-in parent without the cookie goes to the PIN page.
