"use client";

import { useState } from "react";
import { allowStoryLink } from "@/app/kid/actions";
import { BookOpen, Clapperboard, Library, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

const hubs = [
  {
    id: "lumni",
    title: "Lumni Vidéos",
    en: "Animated videos",
    fr: "Vidéos animées",
    href: "https://www.lumni.fr/primaire/ce1",
    icon: Clapperboard,
    className: "bg-gradient-to-br from-grape to-plum text-white",
  },
  {
    id: "fable",
    title: "The Fable Cottage",
    en: "Interactive read-alongs",
    fr: "Lectures à jouer",
    href: "https://www.thefablecottage.com/french",
    icon: BookOpen,
    className: "bg-gradient-to-br from-sun to-hot text-plum",
  },
  {
    id: "iletait",
    title: "Il était une histoire",
    en: "Animated fairy tales",
    fr: "Contes animés",
    href: "https://www.iletaitunehistoire.com/",
    icon: Sparkles,
    className: "bg-gradient-to-br from-hot to-grape text-white",
  },
  {
    id: "boukili",
    title: "Boukili",
    en: "Illustrated books",
    fr: "Livres illustrés",
    href: "https://boukili.ca/",
    icon: Library,
    className: "bg-gradient-to-br from-plum via-grape to-sun text-white",
  },
] as const;

export function StoryLibrary({ lang }: { lang: "fr" | "en" }) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<(typeof hubs)[number] | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [pinError, setPinError] = useState("");
  const leave = lang === "en" ? "Leaving Mochi to watch a story! Ask your parent!" : "Tu quittes Mochi pour une histoire ! Demande à un parent !";
  const go = lang === "en" ? "Go to Story" : "Voir l'histoire";
  const cancel = lang === "en" ? "Cancel" : "Annuler";

  return (
    <>
      <div className="grid grid-cols-1 gap-3 min-[820px]:grid-cols-2">
        {hubs.map((hub, index) => {
          const Icon = hub.icon;
          return (
            <motion.button
              key={hub.id}
              type="button"
              onClick={() => setOpen(hub)}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduced ? { duration: 0 } : { delay: index * 0.05 }}
              className={`flex min-h-28 flex-col items-start justify-between rounded-3xl p-4 text-left ${hub.className}`}
            >
              <Icon aria-hidden className="h-8 w-8" />
              <span>
                <span className="block text-xl">{hub.title}</span>
                <span className="block text-sm opacity-90">{lang === "en" ? hub.en : hub.fr}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
      <Dialog open={open !== null} onOpenChange={(next) => { if (!next) { setOpen(null); setAllowed(false); setPinError(""); } }}>
        <DialogContent className="kid">
          <MochiFace />
          <DialogTitle className="mt-3 text-center">{leave}</DialogTitle>
          <div className="mt-4 grid gap-2">
            {allowed && open ? (
              <a
                href={open.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 items-center justify-center rounded-full bg-grape text-lg text-white"
              >
                {go}
              </a>
            ) : (
              <form
                className="grid gap-2"
                action={async (formData) => {
                  const result = await allowStoryLink(String(formData.get("pin") ?? ""));
                  if (result.ok) {
                    setAllowed(true);
                    setPinError("");
                  } else {
                    setPinError(
                      result.error === "need-pin"
                        ? lang === "en"
                          ? "A parent needs to set a PIN first."
                          : "Un parent doit d'abord choisir un code."
                        : lang === "en"
                          ? "That PIN is not right."
                          : "Ce code n'est pas le bon.",
                    );
                  }
                }}
              >
                <label className="text-sm">
                  {lang === "en" ? "Parent PIN" : "Code des parents"}
                  <input name="pin" inputMode="numeric" autoComplete="off" className="mt-1 block h-14 w-full rounded-full bg-white px-4 text-center text-2xl text-plum" />
                </label>
                {pinError ? <p className="text-center text-sm">{pinError}</p> : null}
                <button type="submit" className="flex h-14 items-center justify-center rounded-full bg-grape text-lg text-white">
                  {lang === "en" ? "Unlock" : "Ouvrir"}
                </button>
              </form>
            )}
            <DialogClose className="flex h-14 items-center justify-center rounded-full bg-muted text-lg">{cancel}</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MochiFace() {
  return (
    <svg viewBox="0 0 120 90" className="mx-auto h-24 w-32" role="img" aria-label="Mochi">
      <ellipse cx="60" cy="58" rx="36" ry="26" fill="#fff" />
      <circle cx="34" cy="28" r="12" fill="#fff" />
      <circle cx="86" cy="28" r="12" fill="#fff" />
      <circle cx="34" cy="28" r="6" fill="#ffb6c1" />
      <circle cx="86" cy="28" r="6" fill="#ffb6c1" />
      <circle cx="48" cy="56" r="4" fill="#2A0B4A" />
      <circle cx="72" cy="56" r="4" fill="#2A0B4A" />
      <path d="M54 66 Q60 72 66 66" fill="none" stroke="#FF2E93" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
