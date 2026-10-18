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

## Parent views

| ID | Title | Status | Proof | Notes |
|---|---|---|---|---|
| P1 | Shell, navigation and data layer | DONE | `src/components/parent/parent-nav.tsx`, `src/lib/parent/queries.ts` | Today, Inbox, Calendar, Progress, and More. Scan lives at `/parent/scan`. Curriculum, Voice, Study, and Rewards render. |
| P2 | Today summary | TODO | | |
| P3 | Inbox | TODO | | |
| P4 | Calendar | TODO | | |
| P5 | To do | TODO | | |
| P6 | Progress and Curriculum | TODO | | |
| P7 | Rewards and Voice | TODO | | |
| P8 | Study and Setup | TODO | | |
| P9 | Notifications | TODO | | |
| P10 | Quality | TODO | | |

## A1 route check

Migrations on disk: `0001_core` through `0011_scan_cache`.

Parent pages live under `src/app/parent/(gate)/`, so they share the parent header. `/parent/unlock` is outside that folder, so it renders only the PIN card. The old preview switch sent `/parent/unlock` to `/parent`, which is why the parent screens appeared there. That switch is removed.

Unsigned requests to `/parent` and `/parent/unlock` still go to `/login` first. A signed-in parent without the cookie goes to the PIN page.
