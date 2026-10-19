import Link from "next/link";
import { addTask, addToCalendar, createBreakPlan } from "@/app/parent/(gate)/calendar/actions";
import { tickMessage } from "@/app/parent/(gate)/inbox/actions";
import { approveReward, denyReward, reactToVoice } from "@/app/parent/(gate)/progress/actions";
import { swapTonight } from "@/app/parent/(gate)/setup/roster-actions";
import { doneTonight, remindSoon, snoozeTonight } from "@/app/parent/(gate)/today/actions";
import { Button } from "@/components/ui/button";
import { requireParent } from "@/lib/parent/guard";
import { loadToday } from "@/lib/parent/queries";
import { SnoozeForms } from "@/components/parent/snooze-forms";
import { sourceLabel, tierLabel, visibleBlocks } from "@/lib/parent/today";

export const dynamic = "force-dynamic";

const chip = "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold";

export default async function TodayPage() {
  const { supabase, user, family } = await requireParent();
  const today = await loadToday(supabase, family, user.id);
  const blocks = visibleBlocks({
    comingUp: today.comingUp.length,
    breakBanner: Boolean(today.breakBanner),
    week: Boolean(today.week.together),
    rewards: today.rewards.length,
    recordings: today.recordings.length,
    setup: today.setup.length,
  });

  return (
    <div className="space-y-2">
      <div data-today-primary className="space-y-2">
        <section className="rounded-2xl border border-grape/15 bg-card px-3 py-2">
          <h2 className="font-fredoka text-lg leading-tight text-plum dark:text-white">Needs you</h2>
          {today.unseenCount === 0 ? (
            <p className="mt-1 flex items-center gap-2 text-sm">
              <CheckIcon />
              All caught up. Nothing is waiting for you.
            </p>
          ) : (
            <p className="mt-1 text-sm">{today.unseenCount === 1 ? "1 message needs you." : `${today.unseenCount} messages need you.`}</p>
          )}
          {today.needsYou.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {today.needsYou.map((card) => (
                <li key={card.id} className="rounded-xl border border-border px-3 py-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className={chip}>{tierLabel(card.tier)}</span>
                    <span className={chip}>{sourceLabel(card.source)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold">{card.title}</p>
                  {card.summary ? <p className="text-sm">{card.summary}</p> : null}
                  {card.original ? <p className="line-clamp-2 text-xs text-muted-foreground">{card.original}</p> : null}
                  {card.waitingFor ? <p className="text-sm font-medium">{card.waitingFor}</p> : null}
                  {card.ticks.length > 0 ? <p className="text-xs text-muted-foreground">{card.ticks.map((tick) => `${tick.name} ${tick.seen ? "✓" : "○"}`).join("  ·  ")}</p> : null}
                  {card.seenByMe ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form action={addTask}>
                        <input type="hidden" name="messageId" value={card.id} />
                        <Button type="submit" size="lg" variant="outline">+ To do</Button>
                      </form>
                      <form action={addToCalendar}>
                        <input type="hidden" name="messageId" value={card.id} />
                        <Button type="submit" size="lg" variant="outline">Add to calendar</Button>
                      </form>
                      <details className="rounded-md border border-border px-3">
                        <summary className="flex h-12 cursor-pointer items-center text-sm font-medium">Remind me</summary>
                        <SnoozeForms action={remindSoon} messageId={card.id} />
                      </details>
                    </div>
                  ) : (
                    <form action={tickMessage} className="mt-2">
                      <input type="hidden" name="messageId" value={card.id} />
                      <Button type="submit" size="lg">I&apos;ve seen this</Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          {today.unseenCount > 0 ? (
            <Link href="/parent/inbox" className="mt-2 inline-flex h-12 items-center text-sm font-semibold underline">
              Open inbox ({today.unseenCount})
            </Link>
          ) : null}
        </section>

        <section className="rounded-2xl border border-grape/15 bg-card px-3 py-2">
          <h2 className="font-fredoka text-lg leading-tight text-plum dark:text-white">Tonight</h2>
          <p className="mt-1 text-sm">{today.tonightDone ? `${today.tonightLine}. Done.` : today.tonightLine}</p>
          {today.tonightQuestions.length > 0 ? (
            <details className="mt-1">
              <summary className="cursor-pointer text-sm font-medium">Coaching questions</summary>
              <ol className="mt-1 space-y-1 text-sm">
                {today.tonightQuestions.map((question) => (
                  <li key={`${question.fr}-${question.en}`}>
                    {question.fr ? <p>{question.fr}</p> : null}
                    {question.en ? <p className="text-muted-foreground">{question.en}</p> : null}
                    {question.answer ? <p>Answer: {question.answer}</p> : null}
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
          <div className="mt-2 flex flex-wrap items-start gap-2">
            {today.swapLeaderId ? (
              <form action={swapTonight}>
                <input type="hidden" name="leaderId" value={today.swapLeaderId} />
                <Button type="submit" size="lg" variant="outline">Swap parent</Button>
              </form>
            ) : null}
            <details className="rounded-md border border-border px-3">
              <summary className="flex h-12 cursor-pointer items-center text-sm font-medium">Snooze</summary>
              <SnoozeForms action={snoozeTonight} />
            </details>
            <form action={doneTonight}>
              <Button type="submit" size="lg" disabled={today.tonightDone}>Done</Button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-grape/15 bg-card px-3 py-2">
          <h2 className="font-fredoka text-lg leading-tight text-plum dark:text-white">Homework today</h2>
          <p className="mt-1 text-sm">{today.homework}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/parent/scan" className="inline-flex h-12 items-center rounded-md bg-grape px-4 text-sm font-semibold text-white">
              Scan homework
            </Link>
            {today.briefReady ? (
              <Link href="/parent/scan" className="inline-flex h-12 items-center rounded-md border border-border px-4 text-sm font-semibold">
                Open parent brief
              </Link>
            ) : null}
          </div>
        </section>
      </div>

      <div data-today-rest className="space-y-2">
        {blocks.includes("coming") ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">Coming up (next 7 days)</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {today.comingUp.map((item) => (
                <li key={item.id}>
                  {item.kind === "holiday" ? "🏖️ " : item.kind === "flying" ? "✈️ " : ""}
                  {item.label} · {item.when}
                </li>
              ))}
            </ul>
            <Link href="/parent/calendar" className="mt-2 inline-flex h-12 items-center text-sm font-semibold underline">Add event</Link>
          </section>
        ) : null}

        {blocks.includes("break") && today.breakBanner ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">Break</h2>
            <p className="mt-1 text-sm">{today.breakBanner}</p>
            <Link href="/parent/curriculum" className="mt-2 inline-flex h-12 items-center text-sm font-semibold underline">Curriculum</Link>
            {today.breakPlanned ? null : (
              <form action={createBreakPlan} className="mt-2">
                <Button type="submit" size="lg">Add the break plan to the calendar</Button>
              </form>
            )}
          </section>
        ) : null}

        {blocks.includes("week") ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">This week at a glance</h2>
            <p className="mt-1 text-sm">
              {today.week.homework} homework, {today.week.games} games, {today.week.logic} logic, {today.week.voice} voice, {today.week.stories} stories.
              {" "}{today.week.studyMinutes} active study minutes. {today.week.stars} stars earned. {today.week.hints} hints used.
              {" "}{today.week.strong} strong, {today.week.practicing} practicing.
            </p>
            <p className="mt-2 text-sm font-semibold">Do it together: {today.week.together}</p>
          </section>
        ) : null}

        {blocks.includes("rewards") ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">Rewards waiting</h2>
            <ul className="mt-2 space-y-2">
              {today.rewards.map((reward) => (
                <li key={reward.id}>
                  <p className="text-sm">Yana wants: {reward.title} ({reward.cost} stars). Balance {today.stars}.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={approveReward}>
                      <input type="hidden" name="id" value={reward.id} />
                      <Button type="submit" size="lg">Approve</Button>
                    </form>
                    <form action={denyReward}>
                      <input type="hidden" name="id" value={reward.id} />
                      <Button type="submit" size="lg" variant="outline">Not now</Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {blocks.includes("recordings") ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">New voice recordings</h2>
            <ul className="mt-2 space-y-3">
              {today.recordings.map((clip) => (
                <li key={clip.id}>
                  <p className="text-sm">{clip.createdAt.slice(0, 16).replace("T", " ")}</p>
                  {clip.url ? <audio className="mt-1 w-full" controls src={clip.url} /> : null}
                  <div className="mt-2 flex gap-2">
                    {["👍", "❤️", "🌟"].map((reaction) => (
                      <form key={reaction} action={reactToVoice}>
                        <input type="hidden" name="id" value={clip.id} />
                        <input type="hidden" name="reaction" value={reaction} />
                        <Button type="submit" size="lg" variant="outline" aria-label={reaction === "👍" ? "Thumbs up" : reaction === "❤️" ? "Heart" : "Star"}>{reaction}</Button>
                      </form>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {blocks.includes("setup") ? (
          <section className="rounded-2xl border border-grape/15 bg-card px-3 py-3">
            <h2 className="font-fredoka text-lg text-plum dark:text-white">Setup health</h2>
            <ul className="mt-2 space-y-2">
              {today.setup.map((item) => (
                <li key={item.label} className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">{item.label}</p>
                  <Link href={item.href} className="inline-flex h-12 items-center rounded-md border border-border px-4 text-sm font-semibold">Fix</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-grape" aria-hidden="true">
      <path d="M3 8.5 6.2 12 13 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
