import type { BubbleFriend } from "@/lib/mochi";

const fill: Record<BubbleFriend | "mochi", string> = {
  mochi: "#fff",
  bunny: "#f7c6d8",
  panda: "#f4f4f5",
  fox: "#fb923c",
  corgi: "#f6c453",
  hamster: "#e7c39a",
};

export function FriendMark({ friend, locked = false }: { friend: BubbleFriend | "mochi"; locked?: boolean }) {
  const color = locked ? "#8b6cb0" : fill[friend];
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
      {friend === "mochi" ? (
        <>
          <circle cx="22" cy="20" r="8" fill={color} />
          <circle cx="42" cy="20" r="8" fill={color} />
          <circle cx="32" cy="38" r="16" fill={color} />
        </>
      ) : null}
      {friend === "bunny" ? (
        <>
          <ellipse cx="24" cy="16" rx="6" ry="14" fill={color} />
          <ellipse cx="40" cy="16" rx="6" ry="14" fill={color} />
          <circle cx="32" cy="38" r="16" fill={color} />
        </>
      ) : null}
      {friend === "panda" ? (
        <>
          <circle cx="20" cy="22" r="8" fill={locked ? color : "#2A0B4A"} />
          <circle cx="44" cy="22" r="8" fill={locked ? color : "#2A0B4A"} />
          <circle cx="32" cy="36" r="16" fill={color} />
        </>
      ) : null}
      {friend === "fox" ? (
        <>
          <polygon points="16,28 24,8 32,28" fill={color} />
          <polygon points="32,28 40,8 48,28" fill={color} />
          <circle cx="32" cy="40" r="14" fill={color} />
        </>
      ) : null}
      {friend === "corgi" ? (
        <>
          <ellipse cx="34" cy="40" rx="20" ry="12" fill={color} />
          <circle cx="16" cy="30" r="10" fill={color} />
        </>
      ) : null}
      {friend === "hamster" ? (
        <>
          <circle cx="22" cy="24" r="6" fill={color} />
          <circle cx="42" cy="24" r="6" fill={color} />
          <circle cx="32" cy="38" r="16" fill={color} />
        </>
      ) : null}
    </svg>
  );
}
