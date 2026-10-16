"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setChildLanguage } from "@/app/parent/(gate)/setup/actions";

export function LanguageSwitch({ language }: { language: "fr" | "en" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: "fr" | "en") {
    if (next === language || pending) return;
    const body = new FormData();
    body.set("language", next);
    startTransition(async () => {
      await setChildLanguage(body);
      router.refresh();
    });
  }

  return (
    <div className="flex rounded-full border border-grape/20 bg-white p-1 shadow-md" role="group" aria-label="Language">
      <LangButton label="EN" name="English" active={language === "en"} disabled={pending} onClick={() => choose("en")} />
      <LangButton label="FR" name="French" active={language === "fr"} disabled={pending} onClick={() => choose("fr")} />
    </div>
  );
}

function LangButton({
  label,
  name,
  active,
  disabled,
  onClick,
}: {
  label: string;
  name: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-sun px-3 py-1.5 text-sm font-semibold text-plum"
          : "rounded-full px-3 py-1.5 text-sm font-semibold text-plum/60"
      }
    >
      {label}
    </button>
  );
}
