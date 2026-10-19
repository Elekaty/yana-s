import Link from "next/link";

const tones = {
  sun: "bg-sun text-plum shadow-[0_8px_0_#e0b520]",
  hot: "bg-hot text-white shadow-[0_8px_0_#c4186e]",
  grape: "bg-grape text-white shadow-[0_8px_0_#5b21b6]",
} as const;

export function PlayChoice({
  href,
  title,
  emoji,
  tone,
  primary = false,
}: {
  href: string;
  title: string;
  emoji: string;
  tone: keyof typeof tones;
  primary?: boolean;
}) {
  return (
    <Link data-primary={primary ? "true" : undefined} href={href} className={`flex h-16 items-center justify-center gap-2 rounded-full px-4 text-2xl ${tones[tone]}`}>
      <span aria-hidden>{emoji}</span>
      {title}
    </Link>
  );
}
