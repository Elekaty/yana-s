"use client";

import { FriendMark } from "@/components/mochi/friend-mark";
import { Mochi } from "@/components/mochi/Mochi";
import type { BubbleFriend } from "@/lib/mochi";
import { FRIEND_CAST } from "@/lib/mochi/friends";
import { speak } from "@/lib/speak";

export function CrewStrip({
  crew,
  lang,
  childName,
  voice = true,
}: {
  crew: BubbleFriend[];
  lang: "fr" | "en";
  childName: string;
  voice?: boolean;
}) {
  return (
    <div className="flex items-end justify-center gap-2 rounded-[28px] bg-[#3a1468] px-3 py-3">
      <div className="w-24 shrink-0">
        <Mochi action="idle" mood="alert" look={{ x: 0, y: 0 }} paused={false} reduced={false} label={lang === "en" ? "Mochi the cat" : "Mochi le chat"} />
      </div>
      {crew.map((friend) => (
        <button
          key={friend}
          type="button"
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "#4a1d7a" }}
          aria-label={FRIEND_CAST[friend].name}
          onClick={() => {
            if (!voice) return;
            const line = lang === "en" ? FRIEND_CAST[friend].en : FRIEND_CAST[friend].fr;
            speak({ text: line.replaceAll("{name}", childName || (lang === "fr" ? "toi" : "you")), lang });
          }}
        >
          <FriendMark friend={friend} />
        </button>
      ))}
    </div>
  );
}
