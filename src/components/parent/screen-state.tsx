"use client";

import Link from "next/link";

export function LoadingState() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-40 animate-pulse rounded-full bg-plum/10 dark:bg-white/10" />
      <div className="h-24 animate-pulse rounded-2xl bg-plum/10 dark:bg-white/10" />
      <div className="h-24 animate-pulse rounded-2xl bg-plum/10 dark:bg-white/10" />
    </div>
  );
}

export function EmptyState({ title, body, href, action }: { title: string; body: string; href?: string; action?: string }) {
  return (
    <section className="rounded-2xl border border-grape/15 bg-card p-5 text-plum dark:text-white">
      <h1 className="font-fredoka text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      {href && action ? (
        <Link href={href} className="mt-4 inline-flex h-12 items-center rounded-full bg-grape px-4 text-sm font-semibold text-white">
          {action}
        </Link>
      ) : null}
    </section>
  );
}

export function ErrorState({ title, body, onRetry }: { title: string; body: string; onRetry: () => void }) {
  return (
    <section className="rounded-2xl border border-hot/40 bg-card p-5 text-plum dark:text-white">
      <h1 className="font-fredoka text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex h-12 items-center rounded-full bg-plum px-4 text-sm font-semibold text-white">
        Try again
      </button>
    </section>
  );
}
