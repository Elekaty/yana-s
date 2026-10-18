# Cursor prompt: the parent views (exact spec and build steps)

**Goal.** Two tired parents open the app, understand in 30 seconds what needs them today, act, and leave. Everything on the parent side is in English, calm and minimal (shadcn/ui, light and dark). Save this file as `docs/PARENT_VIEWS.md`. Do one step (P1 to P10) per Cursor session. Begin each session with:

> Read `docs/BUILD_PLAN.md`, `docs/BUILD_PLAN_V2.md`, `docs/PARENT_VIEWS.md` and the Phase 0 rules. Do only step P__. Plan first, list the files and migrations you will touch, wait for my OK, then build. Run lint, typecheck and tests, tell me how to verify the "Done when" line, and stop.

**Prerequisite:** step G1 in `CURSOR_PROMPT_GAPS.md` (real login and server-side PIN) is finished. Do not build parent screens on top of an open parent area.

---

## A. Rules for every parent screen
- **Two parents, one family.** Both see the same data. Every action records who did it ("Mom", "Dad").
- **Nothing disappears unseen.** A message leaves the Inbox only after **both** parents tick it, then it moves to the Archive folder. There is no delete.
- **Needs-attention first.** Show only what needs an adult at the top; healthy items are quiet.
- **Every list has three states:** loading (skeleton), empty (a friendly sentence and the next action), error (what happened and a retry button). Never show a raw migration or SQL message; link to the Setup checklist instead.
- **Phone first.** One column, thumb-reachable bottom tab bar, 48 px tap targets. On tablets and desktops a two-column layout.
- **Snooze everywhere:** 30 min, 45 min, 1 hour, custom minutes.
- **Language:** English; French originals are always shown beside English summaries.
- **Access:** parent session plus the PIN unlock. Leaving the parent area (Kid mode button) clears the PIN cookie.

## B. Navigation
**Header (every parent screen):** child name, today's one-line plan (for example "Tonight: Dad, 7:30 pm, 10 min"), star balance, language switch, Dark/Light toggle, **Kid mode** button.
**Bottom tab bar (phone):** **Today** (home), **Inbox** (red badge = unseen count), **Calendar**, **Progress**, **More** (opens: To do, Scan, Curriculum, Voice, Rewards, Study and prizes, Setup). On wider screens show all as a left sidebar.
**Routes:** `/parent` = Today (the new summary); `/parent/scan`; `/parent/inbox`; `/parent/calendar`; `/parent/todo`; `/parent/progress`; `/parent/curriculum`; `/parent/voice`; `/parent/rewards`; `/parent/study`; `/parent/setup`; `/parent/unlock`. The old Scan landing page moves to `/parent/scan` and `/parent` redirects nobody away from Today.

---

## C. The Today summary (the exact "summary view")
This is the first screen after unlocking. On a phone, the first three blocks must be visible without scrolling. Show blocks in this order, and **hide any block that has nothing to show** except blocks 1 to 3.

1. **Needs you** (always shown)
   - If nothing is unseen: "All caught up. Nothing is waiting for you." with a small check icon.
   - Otherwise: "N messages need you" and up to 3 cards, urgent first. Each card: tier chip (Urgent, Important, FYI), source chip (Telegram, Email), headline, one-line English summary, French original in smaller text, Mom/Dad tick chips, and one button **I've seen this**. After you tick, the buttons become **+ To do**, **Add to calendar**, **Remind me**. Link: "Open inbox (N)".
   - A card for an **urgent message not yet ticked by the other parent** says "Waiting for Dad".
2. **Tonight** (always shown)
   - Who leads, time and length: "Dad, 7:30 pm, 10 min", or "Break: 10 min of games and reading" on holidays, or "Yana solo, 5 min, plus a voice note" when neither parent is free.
   - Three coaching questions for tonight with expected answers (French question, English meaning, expected answer), collapsed by default.
   - Buttons: **Swap parent**, **Snooze** (30, 45, 1 hour, custom), **Done**.
3. **Homework today** (always shown)
   - Status line: Not scanned / Scanned, not started / In progress (step X of Y) / Done / Stuck, needs you.
   - Big button **Scan homework**; when a brief exists, **Open parent brief** (what the page is, how to help, 3 questions with answers).
4. **Coming up (next 7 days)**
   - Up to 5 items: school events from messages, holidays (🏖️), Mom's roster days (✈️), family events, reminders. A line "Add event".
5. **Break or month banner** (shown on holidays and in the last 3 school days before one)
   - "Toussaint break: back Mon 2 Nov. Here is what to expect in November" with a link to the Curriculum screen, and **Add the break plan to the calendar** if not done.
6. **This week at a glance**
   - Activities done (homework, games, logic, voice, stories), active study minutes, stars earned, hints used, skills strong and practicing, and **one "Do it together" suggestion**.
7. **Rewards waiting** (only if there are pending requests): "Yana wants: Pick the weekend movie (30 stars). Balance 34." Buttons **Approve** and **Not now**.
8. **New voice recordings** (only if unreacted ones exist): audio player and 👍 ❤️ 🌟.
9. **Setup health** (only if something is wrong): "Telegram is not linked", "Email forwarding is not set up", "Roster missing for next month" (shown from the 25th), each with a **Fix** link.

---

## D. Each other screen, exactly

### D1. Scan (`/parent/scan`)
- Large dashed dropzone: "Drop a photo of the homework or tap to take one". Camera capture on phones, drag-and-drop on desktop.
- After upload: "Mochi is reading your page…" with progress; then the **Translation card**: subject, what Yana is learning (one sentence), how to help (one sentence), a "Please check" flag when confidence is low, the 1 to 3 mini-tasks (French instruction with English), and 3 coaching questions with expected answers.
- Footer line: "Read by AI" or "Answered from cache (the same photo was scanned before)". Buttons: **Read again with AI**, **Scan another page**.
- Errors: unreadable photo gets "I could not read this. Try again with more light" and a retry; the saved image stays.

### D2. Inbox (`/parent/inbox`)
- Filter chips: All, Urgent, Important, FYI, Waiting for me, Archived.
- Cards sorted urgent, important, FYI, newest first; each as in block C1, with the full message, attachments (image or PDF preview), and the English summary beside the French original.
- Actions after your tick: **+ To do**, **Add to calendar** (reminder choices: 1 day before, morning of, 1 week and 1 day before; default 1 day before if the date is over a week away), **Remind me** (30, 45, 1 hour, custom), **Archive** (disabled with "needs both parents" until both have ticked), **Undo my tick** (until the other parent ticks), **Change tier** and "Always treat this sender as…".
- **Archived** tab: a searchable, restorable folder. No delete button anywhere.
- Empty state: "No messages yet. Forward a school email or post in the linked Telegram group."

### D3. Calendar (`/parent/calendar`)
- Month grid with icons per day: ✈️ Mom flying, 🏫 school, 🏠 family, 📝 homework, 🏖️ holiday. Tap a day for its list. Previous/next month.
- "Add to calendar" form: title, date, type, reminder. Each event has **Remove**. Holiday ranges (for example the Toussaint break) draw across days.
- "Coming up" list beneath the grid. Link to download an ICS feed for the parents' own calendars.

### D4. To do (`/parent/todo`)
- Open tasks with title, due date, who owns it, and the source message link. Buttons: **Done**, **Snooze**, **Reassign**. Quick add line at the bottom.
- "This month" card: the plan items for the current month (from Curriculum) with ticks.

### D5. Progress (`/parent/progress`)
- This week: counts by activity, active study minutes, stars, hints used, recordings.
- Skills: Strong, Practicing, Suggested next (tap a skill to open it in Curriculum).
- **Reading log:** library stories Yana opened, each with **She read it** (only then stars and the reading skill update).
- **AI usage:** scans read by AI versus answered from cache.
- **Weekly digest preview** (plain English paragraph) and a **Send to email and Telegram** button; also sent automatically each Sunday.
- Engagement alert when this week's play dropped by a third: "Yana played less this week. Try a family game or a new theme."

### D6. Curriculum (`/parent/curriculum`)
- **Break card** (when relevant) and **What to expect after the break**.
- **Tables used in games:** checkboxes 2, 3, 4, 5, 10.
- **Month by month** (September to July): every item shows a subject chip and a source tag (National programme, Typical, Yours). Buttons: **Done**, **Edit**, **Remove**; each month has **Add your own item**. Today's month is highlighted.
- **Upload the teacher's progression** (image or PDF): Gemini extracts it, the parent confirms, and it replaces the Typical items (source "Teacher").
- **Skills** list (23 seeded, plus your own) with status Not started, Practicing, Strong, and an "Ask her" question for each.

### D7. Voice (`/parent/voice`)
- Yana's recordings with audio players, date and phrase, and reaction buttons 👍 ❤️ 🌟 (voice-note reply later). Empty state explains where recordings come from.

### D8. Rewards (`/parent/rewards`)
- **New reward** form (title and star cost). **Requests** list with **Approve** (deducts stars) and **Not now**. **Reward vault** list with remove. Balance shown at the top.

### D9. Study and prizes (`/parent/study`)
- Study block (10 to 30 min), break length (10, 15, 20), warning (5 min before), maximum postponements (default 2). Text: "Only a parent can skip a break, with the PIN."
- Automatic prizes: on-time bonus (stars per day, +10 for a perfect week), study chest (every N minutes of active study, daily maximum). Daily play cap. Town spending cap. **Save**.

### D10. Setup (`/parent/setup`)
- **Family:** members (Mom, Dad), invite the other parent, change PIN, child name, Mochi's name.
- **Telegram:** real family code, the three steps, "Register webhook" button, linked or not linked.
- **Email:** the real forwarding address, allowed senders (add and remove), a test button.
- **Try the pipeline:** paste a French message to see its tier.
- **Roster:** upload (screenshot, PDF or photo), edit each day (off, flying, standby, layover), **Confirm roster**; reminder on the 25th.
- **Evening plan:** Dad's free-after time and free weekdays, Mom's home-evening time, and the next 7 evenings preview.
- **Story library links:** list, add, remove (Yana needs the PIN to open one).
- **Game vocabulary** tags and **Word lists** for Say it out loud.
- **Setup checklist** link (migrations, environment, webhook, email, cron).

---

## E. Build steps for Cursor
- **P1: Shell, navigation and data layer.** Create the header, bottom tab bar and sidebar, the routes above (redirect old routes), loading/empty/error components, and one data module (`lib/parent/queries.ts`) that returns everything the Today screen needs in a single call. **Done when** every route renders in both themes at 390 px and 1024 px.
- **P2: Today summary.** Build blocks 1 to 9 of section C, hiding empty blocks. **Done when** with seeded data the blocks appear in order, the first three fit a phone screen, and an empty family shows only "All caught up", Tonight and Homework.
- **P3: Inbox.** Section D2 including filters, the two-tick rule (UI and `archive_message`), undo, tier override, Archived folder. **Done when** a message cannot be archived until both parents tick and Today and Inbox always agree.
- **P4: Calendar.** Section D3 with holiday ranges, add and remove, reminders, ICS. **Done when** adding an event from a message creates the reminders chosen.
- **P5: To do and the month card.** Section D4. **Done when** a task created from a message links back to it.
- **P6: Progress and Curriculum.** Sections D5 and D6, including the reading log, AI usage, digest and the editable plan. **Done when** editing a plan item saves for the family and a game round updates a skill.
- **P7: Rewards and Voice.** Sections D7 and D8. **Done when** approving a request lowers the balance by exactly the cost.
- **P8: Study and prizes, and Setup.** Sections D9 and D10. **Done when** Setup shows real values (no "preview"), and saving Study settings changes the kid break timer.
- **P9: Notifications and digest.** Urgent: push and Telegram to both parents at once; Important: a 7 pm digest; FYI: weekly; an urgent message unseen for 2 hours re-alerts; Sunday digest. Telegram buttons: Done, 30, 45, 60, Custom. **Done when** a test urgent message reaches both parents and the snooze buttons update the app.
- **P10: Quality.** Playwright tests for every parent route (signed out, parent without PIN, parent with PIN), accessibility (keyboard, contrast, reduced motion), a Lighthouse phone profile, and a written empty/loading/error check for each list. **Done when** the tests pass and a signed-out visitor sees nothing.
