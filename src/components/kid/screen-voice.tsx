"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { kidLine } from "@/lib/kid/lines";
import { speak } from "@/lib/speak";

export function ScreenVoice({ lang, name, voice }: { lang: "fr" | "en"; name: string; voice: boolean }) {
  const path = usePathname() || "/kid/home";
  const line = kidLine(path, lang, name);

  useEffect(() => {
    if (!voice || document.documentElement.dataset.mochiBusy === "1") return;
    const id = window.setTimeout(() => speak({ text: line, lang }), 0);
    return () => window.clearTimeout(id);
  }, [voice, line, lang]);

  useEffect(() => {
    let timer = 0;
    let held: Element | null = null;
    function nameOf(el: Element) {
      const aria = el.getAttribute("aria-label");
      if (aria) return aria.replace(/\s+/g, " ").trim();
      const parts: string[] = [];
      for (const node of el.childNodes) {
        if (node instanceof Element && node.getAttribute("aria-hidden") === "true") continue;
        parts.push(node.textContent ?? "");
      }
      return parts.join(" ").replace(/\s+/g, " ").trim();
    }
    function down(event: PointerEvent) {
      const el = event.target instanceof Element ? event.target.closest("a, button") : null;
      if (!el || el.hasAttribute("data-repeat")) return;
      held = el;
      timer = window.setTimeout(() => {
        if (!voice || held !== el) return;
        const text = nameOf(el);
        if (text) speak({ text, lang });
      }, 600);
    }
    function up() {
      window.clearTimeout(timer);
      held = null;
    }
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    return () => {
      up();
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, [voice, lang]);

  return (
    <div className="fixed top-0 left-2 z-30 flex h-16 max-w-[calc(100%-20rem)] items-center gap-3">
      <button
        type="button"
        data-repeat="true"
        aria-label={lang === "en" ? "Listen" : "Écouter"}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl"
        onClick={() => {
          if (voice) speak({ text: line, lang });
        }}
      >
        <span aria-hidden>🔊</span>
      </button>
      <p className="truncate text-sm">{line}</p>
    </div>
  );
}
