import Link from "next/link";

const tones = {
  sun: "bg-sun text-plum shadow-[0_8px_0_#e0b520]",
  hot: "bg-hot text-white shadow-[0_8px_0_#c4186e]",
  grape: "bg-grape text-white shadow-[0_8px_0_#5b21b6]",
} as const;

export function PlayChoice({
  href,
  title,
  hint,
  emoji,
  tone,
}: {
  href: string;
  title: string;
  hint: string;
  emoji: string;
  tone: keyof typeof tones;
}) {
  return (
    <Link href={href} className={`flex h-28 items-center gap-4 rounded-3xl px-4 ring-2 ring-white/40 ${tones[tone]}`}>
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-4xl" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0">
        <span className="block text-3xl leading-none">{title}</span>
        <span className="mt-1 block text-sm opacity-80">{hint}</span>
      </span>
    </Link>
  );
}
