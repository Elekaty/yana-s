# Cursor prompt FINAL: "Mochi & Friends" (Supabase + Vercel)

Replaces all earlier prompt files. Put **Phase 0** in `.cursor/rules/project.mdc` (alwaysApply: true). Paste one phase at a time; do not start the next until its "Done when" passes. Reference UI: `ui/mochi-app-prototype.html` (look, layout and behavior to match). Strategy doc: `docs/strategy.md`.

**Decisions locked (do not revisit without asking):**
1. Child home = Mochi alive in the salon with tabs (Home, Homework, Games). The Games hub is three floating islands: Game Bay, Logic Lagoon, Creative Cove, with Stories and My Friends beside them. The Store is reached from Home.
2. Homework photos are compressed on the device and a compressed copy is kept in private storage.
3. Parent side is calm and minimal (shadcn/ui, light/dark toggle); the child side is bright and playful.
4. Everything is in scope. The app is not finished until every phase passes its "Done when".
5. Phase order: 0 rules, 1 foundation, 2 homework scan slice, 3 child experience, 4 intake, 5 inbox, 6 calendar and reminders, 7 roster and plan, 8 curriculum, rewards, progress, voice, polish.

---

## HOW TO BUILD THIS IN STEPS (read this first)
Do **not** paste the whole file into Cursor at once. Put **Phase 0** in `.cursor/rules/project.mdc` once. Then work through the steps below, one Cursor session each. Commit to GitHub after every step, check the "Done when" line on the deployed Vercel preview, and only then continue. If a step goes wrong, roll back to the last commit instead of stacking fixes.

| Step | Paste into Cursor | You should be able to... |
|---|---|---|
| 0 | Nothing yet: create accounts (GitHub, Supabase, Vercel, Google AI Studio key, Telegram bot via BotFather, Cloudflare). Add Phase 0 to the rules file. | Log in to each service. |
| 1 | Phase 1 (foundation) | Sign in as two parents; the PIN blocks the parent area; the app is live on Vercel. |
| 2 | Phase 2 (homework scan to tasks) | Photograph a worksheet and see a translated card. |
| 3 | Phase 3, first half: Mochi's salon, Home, Homework tab, break timer | Yana can do a scanned homework with hints, and the break works. |
| 4 | Phase 4 (Telegram and email intake) | A forwarded email and a Telegram message each arrive as a saved item. |
| 5 | Phase 5 (inbox, tiers, two-tick rule) | A message cannot be archived until both parents tick. |
| 6 | Phase 6 (calendar, reminders, snooze) plus the school calendar and break mode | A reminder fires and can be snoozed; holidays show on the calendar. |
| 7 | Phase 7 (roster and nightly plan) | Upload a roster, confirm it, see the plan. |
| 8 | Phase 3, second half in three small passes: (a) Bulles and Fruit Slash, (b) Say it out loud and Stories, (c) Logic Lagoon, Creative Cove, Kitchen, Safari, Town, Store | Each game awards stars through the SQL function. |
| 9 | Phase 8 (monthly plan, curriculum, rewards, progress, settings) | Edit the monthly plan; skills update from play. |
| 10 | Polish: accessibility, French review by a native speaker, real-family test | Use it for a week and note what annoys you. |

**Suggested order during a break:** Steps 0 to 2 first (a working scan is the quickest visible win), then Steps 4 to 6 (the inbox and calendar are what the parents need most), then the child-side steps. You can swap Steps 3 and 4 if the school messages matter more to you than Yana's screens.
Each step's prompt should begin with: "Read `docs/strategy.md` and the Phase 0 rules. Plan first, list the files you will create, wait for my OK, then build only this step. Do not touch other phases."

---

## PHASE 0: Rules (always on)

**Product.** A mobile-first, tablet-friendly PWA for two English-speaking parents and their daughter **Yana** (CE1, French school). Three jobs: (1) catch every school message (Telegram group + email), sort it, and make sure two parents see it; (2) turn it into a calendar, to-dos, and a nightly "who helps Yana tonight" plan with reminders; (3) help Yana with homework and speaking French through **Mochi**, a fat white cat, plus games and stories. Parents see English; Yana sees French (parents can switch her to English).

**Stack.** Next.js 14+ App Router, TypeScript, Tailwind, Framer Motion, shadcn/ui (parent side only), Supabase (Auth, Postgres + RLS, Storage, pg_cron), Gemini API (Flash, server-side only), Telegram Bot API, web push, deployed on **Vercel**. Free tiers only (Cursor is the only paid tool). Verify every free-tier limit before relying on it and record them in `docs/limits.md`.

**Hard rules.**
1. **Nothing is lost or hidden before both parents tick it.** No DELETE policy exists on `messages`. Archive is allowed only when every parent in the family has ticked (enforced in SQL, below).
2. Gemini runs server-side only. All output is validated with zod before being stored. Maths answers are computed in code. Strip names, school name and addresses before any Gemini call.
3. Mochi never chats freely. All lines come from a scripted phrase library (FR/EN, personalized with the child's name). Gemini never speaks to the child.
4. Photos, voice recordings and family images are private storage with RLS. Never sent to an AI unless a parent chose to process that item.
5. No ads, trackers, analytics SDKs, dark patterns, lives, or streak guilt. Daily play cap set by parents. Reward effort.
6. Stars change only through the `award_stars` SQL function.
7. Every long task is queued in a `jobs` table (save the original first, then process). Never rely on one long serverless request.
8. Typed everywhere, tests for the planner, classifier rules, validators and SQL functions, `.env.example`, seed script, README. Lint, typecheck and tests must pass before a phase is "done".

**Two experiences.**
- **Parent:** email and password. Tabs: Inbox, Calendar, To do, Progress, Setup. English. Enter parent area only with the PIN; leaving it locks it.
- **Kid mode:** runs on the family device under a parent session. Tabs: Home, Homework, Games, Store. Exiting requires the parent PIN (hash stored in `families.pin_hash`, verified server-side). Kid screens never show the inbox.

**Design.** Purple/pink palette (plum #2A0B4A, grape #7C3AED, hot pink #FF2E93, sun #FFD23F), Fredoka font, 56px kid touch targets, max 3 choices per kid screen, phone portrait and a two-pane tablet layout at 820px+, light and dark themes, respect `prefers-reduced-motion`. Match the prototype.

### Mochi: the alive white cat in the salon
- A fat white cat (layered SVG, animated in code with Framer Motion) in a living-room scene (window, curtains, sofa, rug, plant, picture frames, a yarn ball). Build her as a **behavior state machine**: `idle`, `wander` (walks left and right, flipping direction), `chase-yarn` (tap the yarn: it rolls, she chases and pounces), `nap` (eyes closed, "💤", slow breathing, wakes when touched), `purr` (squish and hearts when tapped), `cheer`, `think`, `sleepy-at-bedtime`, `greet` (by time of day). Pick a random idle behavior every 6 to 7 seconds. Pause when the tab is hidden. Eyes follow the pointer.
- **Friends in bubbles:** a bunny, panda, fox, corgi or hamster bubble floats up every ~9 seconds. Popping it plays a greeting, awards 2 stars, adds the friend to `friends_unlocked`, and the friend stands beside Mochi for a few seconds.
- **Art style:** animated-comedy look: big glossy eyes with highlights, expressive eyebrows, open smiles with tongues, soft volume shading, squash-and-stretch on every tap. All characters must be **original designs**; do not copy or closely imitate characters from any film, show or game.
- **Moods and outfits:** moods map to app events. Outfits are bought with stars and stored in `child_outfits`.

### Voice
- **Mochi speaks** every scripted line with the Web Speech API (`speechSynthesis`), fr-FR or en-US by language setting, high pitch, slightly slow rate, prefer a matching installed voice. Speech may start only after the first user gesture. A 🔊/🔇 toggle (stored in `children.settings`) and a parent switch to disable voice entirely.
- **Reading aloud:** homework instructions and story pages are read with a 🔊 button per text block, with word highlighting where supported.
- **Yana's voice (Voix zone):** record with `MediaRecorder` (include a Safari-compatible mime fallback) into the private `voice` bucket. No auto-grading in v1. A parent can react with a thumbs-up or reply with a voice note.
- Build a `speak()` abstraction so we can later swap in pre-recorded audio files (generated once, reviewed by a French speaker, stored in Supabase Storage) without touching callers. Browser voice quality varies by phone; document this in `docs/limits.md`.

---

## PHASE 1: Supabase project, schema, auth, deploy skeleton

**1a. Set up (follow in order, tell me each manual step).** Create the Supabase project. Install the Supabase CLI. Create the GitHub repo. Create the Next.js app. Import the repo into Vercel. Add environment variables in Vercel and `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `INBOUND_EMAIL_SECRET`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`. Push migrations with `supabase db push`. Deploy a "hello" page on Vercel before building features.

**1b. Migration `0001_core.sql`.** Tables (all with `family_id` and RLS on): `families(id, name, pin_hash, timezone)`, `members(id, family_id, user_id, role 'parent'|'guest', display_name)`, `children(id, family_id, name, grade, language, star_balance int default 0, settings jsonb)`, `messages`, `message_acks(message_id, member_id, acked_at, primary key(message_id, member_id))`, `attachments`, `events(id, family_id, title, starts_at, ends_at, source_message_id, remind_offsets int[])`, `tasks(id, family_id, message_id?, scan_id?, title, subject, translated_objective, parent_action, curriculum_skill, confidence real, coaching jsonb, status 'pending'|'completed', reward_stars, due_at, assignee_member_id)`, `reminders(id, family_id, target 'parent'|'child', member_id?, child_id?, ref_type, ref_id, due_at, status 'pending'|'sent'|'done'|'snoozed', snooze_count int default 0)`, `roster_days(family_id, member_id, date, status 'off'|'flying'|'standby'|'layover', start_at?, end_at?)`, `availability(member_id, weekday, from_time, to_time)`, `sessions(id, family_id, child_id, date, start_time, leader_member_id?, duration_min, status)`, `homework_scans(id, family_id, image_path, status, created_at)`, `mini_games(id, task_id, game_type 'flashcard'|'logic'|'physical', game_data jsonb)`, `game_sessions(id, child_id, game, score, stars, created_at)`, `skill_progress(child_id, skill, level, correct, attempts)`, `stories(id, slug, title_fr, title_en, pages jsonb)`, `skills(id, area, title_fr, explanation_en, ask_fr, sort)`, `story_reads(child_id, story_id, completed_at)`, `voice_recordings(id, child_id, path, created_at, parent_reaction)`, `rewards(id, family_id, title, cost_stars, active)`, `purchases(id, reward_id, child_id, status 'requested'|'approved'|'denied')`, `star_ledger(id, child_id, amount, reason, created_at)`, `friends_unlocked`, `child_outfits`, `jobs(id, kind, payload jsonb, status, attempts, run_at)`, `push_subscriptions`.
`messages` columns: `id, family_id, source 'telegram'|'email'|'upload', external_id, raw jsonb, original_text, title, summary_en, tier 'urgent'|'important'|'fyi', type, due_at, event_at, action_required bool, confidence real, status 'new'|'archived', archived_at, created_at`, with `unique(family_id, source, external_id)` and **no delete policy**.

**1c. Critical SQL (implement exactly).**
```sql
create function is_member(fam uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from members where family_id=fam and user_id=auth.uid()) $$;

create function archive_message(p_msg uuid) returns void language plpgsql security definer set search_path=public as $$
declare fam uuid;
begin
  select family_id into fam from messages where id=p_msg;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  if (select count(distinct a.member_id) from message_acks a join members m on m.id=a.member_id
      where a.message_id=p_msg and m.role='parent')
     < (select count(*) from members where family_id=fam and role='parent') then
    raise exception 'both parents must tick first';
  end if;
  update messages set status='archived', archived_at=now() where id=p_msg;
end $$;

create function award_stars(p_child uuid, p_amount int, p_reason text) returns int
language plpgsql security definer set search_path=public as $$
declare fam uuid; today_total int; bal int;
begin
  select family_id into fam from children where id=p_child;
  if not is_member(fam) then raise exception 'forbidden'; end if;
  if p_amount < 1 or p_amount > 5 then raise exception 'bad amount'; end if;
  select coalesce(sum(amount),0) into today_total from star_ledger
    where child_id=p_child and amount>0 and created_at::date=current_date;
  if today_total >= 60 then return (select star_balance from children where id=p_child); end if;
  insert into star_ledger(child_id,amount,reason) values(p_child,p_amount,p_reason);
  update children set star_balance=star_balance+p_amount where id=p_child returning star_balance into bal;
  return bal;
end $$;
```
Also: RLS policies of the form `using (is_member(family_id))` on every table; a `purchase` approval function that deducts stars atomically and only for a parent; private storage buckets `scans`, `voice`, `attachments`, `family` with RLS by family folder.

**1d. App skeleton.** Parent screens use shadcn/ui with a light/dark toggle. Parent login, second-parent invite, PIN set/verify route, kid mode with the PIN exit, i18n (FR/EN), design tokens, PWA manifest and service worker, `/dev/mochi` showing the cat's states and the salon scene.

**Done when:** deployed on Vercel; two parents join one family; the PIN blocks the parent area; RLS tests prove a user cannot read another family's rows; `archive_message` fails unless both parents have ticked.

## PHASE 2: Homework scan slice (parent dashboard to Gemini to tasks)
This is the first working slice, so the parents see value early.
**Parent Command Center** (shadcn/ui; calm, minimal, Linear/Notion feel; light/dark toggle; "scan and get out in 30 seconds"):
- Header: star balance and "X of 4 islands done today" (Homework, Game Bay, Logic Lagoon, Creative Cove).
- A large dashed **Scan Homework** dropzone: drag-and-drop on desktop, camera on phones (`capture="environment"`).
- **Translation feed:** a clean card with subject, translated objective, how to help, 3 coaching questions with answers, and a "Please check" flag when confidence is low.
- A link to the Reward vault (Phase 8).
**Pipeline.** (1) Compress on the device (max 1600px, JPEG, target 300 to 500 KB). (2) Upload to the private `scans` bucket and create a `homework_scans` row (the compressed copy is kept so a parent can re-check). (3) Enqueue a `scan` job and show live status. (4) The job calls Gemini with the system prompt below, using structured-output mode (`responseMimeType: application/json` plus a response schema). (5) Validate with zod. (6) Write `tasks` and `mini_games`. (7) Show it in the feed. Failures keep the image, show "could not read" and a retry button. Keep the request body well under Vercel's current limit (verify and note it in `docs/limits.md`).
**Gemini system prompt (use exactly; never include the school's name):**
```text
You are an expert French CE1 (cycle 2, age 7-8) teacher and a bilingual curriculum translator.
You receive a photo or text of a French school assignment or school note. The parents read English only. The child reads French.
1. Identify the subject and the learning objective, and name the closest CE1 skill if you can.
2. Explain the objective to the parent in plain English in one sentence, and say in one sentence exactly how the parent can help.
3. Split the work into 1 to 3 short mini-tasks the child can do. Write each instruction in simple French and also in English for the parent.
4. For each task give two hints (a gentle nudge, then a stronger one) that never reveal the answer, and the expected answer for the parent.
5. Give 3 short questions the parent can ask the child aloud: in French, with an English meaning and the expected answer.
6. If something is unreadable or you are unsure, lower "confidence" and describe what was unclear in "unclear_note". Never invent text that is not on the page.
Return only JSON that matches the provided schema.
```
**Response schema:**
```json
{
  "parent_dashboard": {"subject": "string", "curriculum_skill": "string", "translated_objective": "string", "parent_action": "string", "confidence": 0.0, "unclear_note": "string"},
  "child_ui": {"island_title": "string",
    "tasks": [{"id": 1, "instruction_fr": "string", "instruction_en": "string",
      "type": "flashcard | multiple_choice | physical_action | say_aloud | write",
      "options": ["string"], "expected_answer": "string", "hint_1": "string", "hint_2": "string", "reward_stars": 1}]},
  "parent_questions": [{"question_fr": "string", "question_en": "string", "expected_answer": "string"}]
}
```
**Mapping.** `parent_dashboard` fills `tasks.subject`, `translated_objective`, `parent_action`, `curriculum_skill`, `confidence`. `child_ui.tasks[]` becomes `mini_games.game_data` (`game_type`: flashcard, logic or physical, chosen from the task type; `say_aloud` and `write` are new types). `parent_questions` fills `tasks.coaching`. Maths expected answers are **recomputed in code**; if they disagree with Gemini, trust the code and flag the task.
**Done when:** a photographed CE1 worksheet becomes a feed card and stored tasks within about 30 seconds, a bad photo shows a retry, and the compressed copy is in private storage.

## PHASE 3: The child's experience (salon, homework, islands, store)
Match `ui/mochi-app-prototype.html`.
- **Home:** Mochi alive in the salon (state machine from Phase 0), friend bubbles, stars, a Today card with snooze, and Store.
- **Homework tab:** capture, scan animation, steps from `mini_games`, Mochi reads each instruction aloud in French, hint ladder using `hint_1` then `hint_2` then "show me", "I'm done" calls `award_stars` with the task's `reward_stars` (server-capped). Parent brief and status (done, stuck, needs you). Autosave each step; resume after interruptions.
- **Games hub = three floating islands** (Framer Motion spring float and parallax clouds; tapping an island expands to full screen with `layoutId`), plus Stories and My Friends buttons:
  1. **Game Bay:** Bulles; **Fruit Slash** with a level picker, Easy (3 big fruits, gravity 360, launch speed about 400, stagger 0.5s) and Medium (4 fruits, gravity 520, launch speed about 480, stagger 0.3s), 5 right answers per round, no bombs, no lives; Mochi's Kitchen; Say-it Safari.
  2. **Logic Lagoon:** permanent 4x4 grid; she builds up to 8 arrows (tap or drag with `@dnd-kit/core`), presses Go, and Mochi walks to the strawberry; levels grow; completion awards stars.
  3. **Creative Cove:** a canvas drawing board (color swatches, clear) and a sound board of 8 C-major pads (Web Audio), with a play-along of the traditional public-domain song "Frère Jacques". Only traditional/public-domain songs; no copyrighted music.
  4. **Stories:** 30 short stories (FR/EN) read aloud. **My Friends:** six characters with names and personalities (Mochi, Praline, Bambou, Roux, Biscuit, Noisette); locked ones appear as silhouettes until met in a bubble.
- **Study blocks and breaks (Homework tab):** a focus bar shows study time and time until the break. Defaults: 20-minute study block, **15-minute break**, a **5-minute heads-up** before it. The heads-up offers +5 or +10 minutes (max 2 postponements, configurable). The break is a full-screen overlay that cannot be dismissed by the child; **only a parent can skip it, with the PIN**. Break menu: a song (traditional public-domain tunes such as "Frère Jacques" and "Au clair de la lune" played with Web Audio, Mochi dances), a pop-the-bubbles game with no scoring, and a **family game** card for parent and child (Jacques a dit, Pierre-feuille-ciseaux, 5 red things, freeze dance) with the French for Yana and an English explanation for the parent. Finishing a break awards 1 star. Time counts only when the app is in the foreground and she has touched the screen in the last 30 seconds. Store timings in `families.settings`.
- **Automatic prizes (Store):** (1) **On-time bonus:** a check-in during the planned window gives stars (default 2 a day) and +10 for a perfect week of 5 on-time days. (2) **Study chest:** every N minutes of *active* study (default 10, idle time never counts) earns a mystery chest, capped per day (default 3). Chest contents are small and fixed-odds: 1 to 3 stars, a sticker, a Mochi dance, or a new friend. All amounts and caps are parent-configurable in Settings, and every award goes through `award_stars`. Do not add anything that rewards time spent in the app without learning activity.
- **Say it out loud (Voix tab), fully specified.** Three tabs: *Practice*, *What's new?* and *My album*. Practice has packs (CE1 dictation words, short sentences, traditional tongue twisters) and a **five-rung ladder per phrase**: (1) listen, with word-by-word highlighting while Mochi reads; (2) whisper; (3) say it, with a live **microphone level meter** (Web Audio `AnalyserNode`) that makes Mochi glow and listen; (4) say it to Mochi; (5) record it for a parent (`MediaRecorder`, default mime type so Safari works) into the private `voice` bucket. **No automatic grading**: the meter only shows she is speaking. If the microphone is blocked, every rung still works with a manual "next" button. "What's new?" gives a French question with a sentence starter and a 20-second recording. Each finished phrase awards 2 stars. Parents see recordings in a Voice tab and react with 👍 ❤️ 🌟 (voice-note replies later); Yana sees the reaction in her album and Mochi says so. Recordings are private and never sent to an AI service.
- **More games in Game Bay:** **Mochi's Kitchen** (a friend orders "trois pommes et deux biscuits"; she taps items onto the plate; numbers in French words; 5 customers per round, difficulty grows) and **Word Safari** (Mochi says "Trouve : lapin" in French; she taps the right animal; optional word reveal; then repeats the word). All games play short sound effects with Web Audio and award stars through `award_stars`.
- **Mochi's salon is interactive and time-aware:** the window shows real day, dusk or night and cycles rain/night/sun when tapped; the lamp glows at dusk and toggles; the wall clock shows the real time and Mochi says it in French; the bookshelf opens Stories; the fish bowl blows bubbles; the plant wiggles; the sofa sends Mochi to nap; fairy lights twinkle; light shafts appear on sunny days. Props are separate SVG groups with `data-p` handlers and keyboard focus.
- **Mochi's Town:** a 12-plot town (`town_plots(child_id, slot, item)`) where stars buy buildings and decorations (flowers 1, tree 2, house 5, fountain 6, school 8, bakery 8, carousel 12, castle 20). Every friend Yana has met lives in the town and strolls around. Purchases go through a SQL function that deducts stars atomically (like `award_stars`). Tapping a building makes Mochi say its French name. Completing the town triggers a celebration. Parents can cap how many stars may be spent on the town.
- **Skills update automatically from play:** every finished round writes a `progress_events` row and nudges `skill_progress` (3 completed rounds of a skill = "strong"): Fruit Slash maps to the multiplication tables skill, Mochi's Kitchen to numbers up to 1000, Word Safari to vocabulary, Logic Lagoon to problem solving, stories and reading phrases to reading fluency, word practice to dictation. A parent's manual status always wins if it is higher.
- **Today's Mission:** if the parent's scan produced reading tasks, show a swipeable flashcard game (`framer-motion`).
- **Store:** she sees rewards and her stars, requests one, and a parent approves it (Phase 8).
- All games share the question engine (skill tags, computed answers, adaptive difficulty), write `game_sessions` and `skill_progress`, call `award_stars`, and respect the daily cap.
**Done when:** every island works at 390px and 1024px, stars are awarded only through the SQL function, and the homework flow resumes after a refresh.

## PHASE 4: Intake (Telegram group + email) and the job queue
- **Telegram:** route `/api/intake/telegram` verifying the secret-token header. Setup instructions: add the bot to the school/class group, BotFather `/setprivacy` -> Disabled, send `/link <family-code>` in the group. After deploy, register the webhook (`setWebhook` with `secret_token`). Ingest text, photos, documents and forwards. If a group disallows bots, a parent can forward messages to the bot in a private chat.
- **Email:** each family gets an inbound address. Use a free inbound route (Cloudflare Email Routing + Email Worker POSTing parsed mail to `/api/intake/email` with `INBOUND_EMAIL_SECRET`). Accept only allowlisted senders. Verify current free-tier limits.
- Save the raw payload and attachments first, de-duplicate by `(source, external_id)` and content hash, enqueue a `classify` job, return 200 immediately.
- **Worker:** `/api/jobs/run` processes queued jobs with retries and a `maxDuration` setting. Supabase `pg_cron` calls it every minute (Vercel Hobby cron is daily only):
```sql
select cron.schedule('run-jobs','* * * * *',$$select net.http_post(url:='https://<APP>.vercel.app/api/jobs/run',headers:='{"Authorization":"Bearer <CRON_SECRET>"}'::jsonb)$$);
```
**Done when:** a forwarded French email and a photo in the Telegram group each appear as a message row within 60 seconds, duplicates are ignored, and a failed Gemini call leaves the saved original with a visible "could not read, open original" status.

## PHASE 5: Inbox, tiers, and the two-tick rule
- **Classifier (rules first, Gemini second).** Urgent: a deadline/event within 48 hours or an explicit required action (permission slip, payment, pickup, sickness), or a sender marked "always urgent". Important: homework, tests, meetings, trips, anything from the teacher. FYI: menus and newsletters. If `confidence < 0.6` move up one tier and show "Please check". One-tap tier override plus "always treat this sender as X".
- **Inbox UI** (match the prototype): sorted urgent/important/FYI; each card shows English summary beside the French original, Mom/Dad ○/✓ chips, **"I've seen this"**, undo until the other parent ticks, then + To do, Add to calendar, Remind me, Archive (calls `archive_message`; button disabled until both ticked), and the Archive folder (searchable, restorable by setting status back through an RPC).
- **Alerts:** urgent -> push + Telegram DM to both parents immediately; important -> 7pm digest; FYI -> weekly digest. An urgent message still not fully ticked after 2 hours re-alerts the parent who hasn't ticked.
**Done when:** a message cannot be archived until both parents tick (UI and DB), undo works before the second tick, and the escalation fires in a test.

## PHASE 6: Calendar, tasks, reminders, snooze
- **Add to calendar from a message:** Gemini extracts the date, the parent confirms it, then an `events` row is created with `remind_offsets` chosen from: 1 day before (default when the date is more than a week away), the morning of, 1 week + 1 day before. Reminders rows are generated from the offsets.
- **Calendar view:** month grid with school events, Mom's roster days (✈️), and a "Coming up" list; ICS feed link for the parents' own calendars.
- **Reminders** to the parent (push + Telegram with inline buttons **Done / 30 / 45 / 60 / Custom**) and to Yana (a Mochi nudge in kid mode). Snooze presets 30 min, 45 min, 1 hour, custom minutes; after 3 snoozes it moves to tomorrow with a visible note; if the assigned parent hasn't responded 20 minutes after the time, notify the other parent. Telegram buttons and in-app actions update the same row.
**Done when:** a snooze fires at the chosen time and shows in both Telegram and the app; the default reminder logic is unit-tested.

## PHASE 7: Roster, availability, and the Tonight plan
- Mom uploads a roster (screenshot/PDF/photo), Gemini extracts to `roster_days`, and a parent confirms on an editable grid (never auto-confirm). Reminder on the 25th. Dad sets his after-work window in `availability`.
- **Planner is a pure, tested function** (no AI): for each day, the parent who is home and free inside Yana's evening window leads; if both are free, rotate by preference; if neither, create a 5-minute solo session plus a voice-note slot. Output one **Tonight** card: who, when, duration, 3 coaching questions. One-tap swap, instant re-plan.
**Done when:** with 5 sample rosters including back-to-back trips, the planner never assigns a parent on a flying day and respects the daily cap.

## PHASE 8: Curriculum, rewards vault, progress, voice, polish
- **School calendar and monthly plan (parent, editable):** tables `school_calendar(id, family_id, kind 'holiday'|'event', starts_on, ends_on, label, source)` and `plan_items(id, family_id, month, period, subject, text, source 'national'|'typical'|'teacher'|'parent', done)`. Seed `school_calendar` with the 2026-2027 French national calendar (Toussaint break Sat 17 Oct to Sun 1 Nov, back Mon 2 Nov; Christmas break Sat 19 Dec to Sun 3 Jan, back Mon 4 Jan; winter break by zone: A 13 Feb to 1 Mar, B 20 Feb to 8 Mar, C 6 to 22 Feb; Armistice Wed 11 Nov; Easter Monday 29 Mar 2027; Pentecost Monday 17 May 2027; school year ends Sat 3 Jul 2027), but **the family's own school calendar always wins** (the school sets its own dates, and an AEFE school abroad may differ), so every date is editable. Seed `plan_items` from the month-by-month outline in `ui/mochi-app-prototype.html` (the `PLAN` array), tagging each item as `national` (official programme markers or calendar) or `typical` (a common CE1 order that varies by school). Parents can edit, add, remove and tick items; edited and added items become `parent`. A parent can upload the teacher's yearly progression and Gemini extracts it into `plan_items` (confirm before saving, source `teacher`). Show "What to expect next month" on the parent Home and in the weekly digest.
- **Break mode:** on any day inside a holiday range the planner returns a light plan (about 10 minutes, default 10:00), the on-time bonus and break timers pause, homework scans are not required, and a "Break plan" action creates weekday calendar practice events with morning-of reminders (stories and reading phrases, counting game, tables game, dictation words, family game and Logic Lagoon).
- **Tables follow the plan:** `children.settings.tables` (default 2, 5, 10; parent-editable) controls which multiplication tables Bulles and Fruit Slash use. Official markers: ×2 from the start of period 2 (November); ×10 and ×3, ×4, ×5 at the latest by period 3 (January to February).
- **Curriculum (parent tab):** a `skills` table seeded from the `CUR` array in the prototype (23 CE1 skills across Français, Mathématiques, Questionner le monde, Langue vivante and EMC). Each skill has a French title, an English explanation, and an "Ask her" question. Status (not started, practicing, strong) updates from `skill_progress` and can be set by hand. Every task, question and game round carries a skill tag. A parent can upload the teacher's progression to match the school's actual order. The outline is general knowledge of the national programme (new French and maths programmes since 2025: numbers to 1000, fractions, regular review, national evaluations in September), so label it "general outline" in the UI.
- **Parent Settings tab:** study block, break length, on-time bonus, study chest frequency and daily cap, with a "demo: next day" toggle only in development.
- **Reward vault (parent):** add and remove rewards with star costs; see requests and approve or decline. Approval deducts stars atomically with a SQL function that only a parent can call.
- **Calendar management:** add and remove events manually (family, school, homework, Mom flying) with reminder choices, per the prototype.
- **Setup screens (parent):** (1) *Telegram*: shows the family link code, the three steps (add the bot, BotFather `/setprivacy` Disable, send `/link <code>`), a connected/disconnected state. (2) *Email*: the family's forwarding address and an allowed-senders list (add, remove). (3) *Try the pipeline*: paste a French message and see it classified into a tier and added to the inbox (rules now, rules + Gemini in production). (4) *Roster*: upload a screenshot, PDF or photo; Gemini extracts days; the parent edits each day (off, flying, standby, layover) and must press **Confirm** before anything is saved; flying and layover days become calendar events; a reminder on the 25th each month. (5) *Evening plan*: Dad's free-after time and free weekdays, Mom's home-evening time.
- **Planner (pure function, unit-tested):** for each evening, Mom home and Dad free alternate by day; if only one is available they lead; if neither, Yana gets a 5-minute solo session plus a voice-note slot. Parent-led sessions are 10 minutes (Dad) or 15 minutes (Mom, longer on home days). The Home "Tonight" card and the Parent header read from this planner, and changing the roster or availability re-plans instantly.
- **Progress tab (parent):** this week's counts by activity (homework, games, logic, voice, stories), active study minutes, stars, hints used, recordings waiting for a reaction, strong/practicing/suggested-next skills, and a weekly English digest preview with a "send to email and Telegram" button (also sent automatically each Sunday).
- **Progress tab:** sessions done and missed, streak with automatic freeze, skills practiced, a "needs another look" list, voice recordings, and the weekly English digest by email and Telegram.
- **Voix zone:** listen, whisper, say, say to Mochi, record; private voice album with parent reactions.
- Guest view-only link (expiring, revocable), accessibility pass, performance pass on the animations, and a full FR/EN review.

---

## Definition of done (every phase)
Lint, typecheck and tests pass; works at 390px and 1024px; no secrets in the client bundle; deployed to Vercel preview and checked; `docs/limits.md` updated; demo script in the README.
