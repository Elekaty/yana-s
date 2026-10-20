import { loadGuestView } from "@/lib/parent/guest-load";

export const dynamic = "force-dynamic";

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await loadGuestView(token);
  if (!view) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-fredoka text-3xl text-plum dark:text-white">This link has ended.</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="font-fredoka text-3xl text-plum dark:text-white">View only</h1>
      <p className="text-sm">{view.childName} · {view.stars} stars</p>
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-xl text-plum dark:text-white">Coming up</h2>
        {view.events.length === 0 ? <p className="mt-2 text-sm">Nothing coming up.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {view.events.map((title, index) => (
              <li key={`${title}-${index}`}>{title}</li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm">This link cannot change anything.</p>
    </main>
  );
}
