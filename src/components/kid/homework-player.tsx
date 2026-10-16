"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { completeStep, saveProgress } from "@/app/kid/actions";
import { compressHomeworkPhoto } from "@/lib/scan/compress";
import { createClient } from "@/lib/supabase/client";
import { fillPhrase, phrases } from "@/lib/phrases";
import { speak } from "@/lib/speak";
import { hintText, type HomeworkStep, type RunStatus } from "@/lib/study/homework";
import { formatClock, type StudyClock } from "@/lib/study/clock";
import type { Copy } from "@/lib/i18n";

export function HomeworkPlayer({
  familyId,
  taskId,
  title,
  steps,
  brief,
  initialStep,
  initialHint,
  initialStatus,
  scanStatus,
  voice,
  lang,
  childName,
  clock,
  copy,
}: {
  familyId: string;
  taskId: string | null;
  title: string;
  steps: HomeworkStep[];
  brief: { objective: string; action: string };
  initialStep: number;
  initialHint: number;
  initialStatus: RunStatus;
  scanStatus: string | null;
  voice: boolean;
  lang: "fr" | "en";
  childName: string;
  clock: StudyClock | null;
  copy: Copy;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [hintLevel, setHintLevel] = useState(initialHint);
  const [status, setStatus] = useState<RunStatus>(initialStatus);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(initialStatus === "done");
  const step = steps[stepIndex];
  const reading = scanStatus === "queued" || scanStatus === "reading" || scanStatus === "saved";

  useEffect(() => {
    if (!reading) return;
    const id = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(id);
  }, [reading, router]);

  async function remember(next: { stepIndex: number; hintLevel: number; status: RunStatus }) {
    if (!taskId) return;
    setStepIndex(next.stepIndex);
    setHintLevel(next.hintLevel);
    setStatus(next.status);
    await saveProgress({ taskId, ...next });
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setBusy(copy.reading);
    try {
      const blob = await compressHomeworkPhoto(file);
      const path = `${familyId}/${crypto.randomUUID()}.jpg`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("scans").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      const saved = await postJson("/api/scans", { imagePath: path });
      const readingResult = await postJson("/api/jobs/run", { scanId: saved.scanId });
      if (readingResult.error) throw new Error(copy.reading);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.reading);
    } finally {
      setBusy("");
    }
  }

  if (reading || busy) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="h-24 w-24 animate-pulse rounded-full bg-white" aria-hidden />
        <p className="text-2xl">{copy.reading}</p>
      </div>
    );
  }

  if (!step || done) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl">{done ? copy.doneTitle : copy.noHomework}</h1>
        {done ? <p className="text-xl">{fillPhrase(phrases.cheer[lang], childName)}</p> : null}
        <label className={choice}>
          {copy.photograph}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => {
              void onFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </label>
        {error ? <p className="text-sun">{error}</p> : null}
      </div>
    );
  }

  const hint = hintText(step, hintLevel);
  const focus = clock && clock.mode !== "break" ? formatClock(clock.remainingSec) : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-3xl">{title}</h1>
        {focus ? <p className="text-lg text-sun">{focus}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <p className="flex-1 text-2xl">{step.instruction}</p>
        {voice ? (
          <button
            type="button"
            aria-label={copy.listen}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl"
            onClick={() => speak({ text: step.instruction, lang })}
          >
            🔊
          </button>
        ) : null}
      </div>
      {hint ? <p className="rounded-3xl bg-white/10 px-4 py-3 text-xl">{hint}</p> : null}
      {brief.objective ? (
        <p className="text-sm text-white/70">
          {copy.parentsBrief}: {brief.objective} {brief.action}
        </p>
      ) : null}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={choice}
          onClick={() => {
            const level = Math.min(3, hintLevel + 1);
            const nextStatus: RunStatus = level >= 3 ? "stuck" : "doing";
            void remember({ stepIndex, hintLevel: level, status: nextStatus });
          }}
        >
          {hintLevel >= 2 ? copy.showMe : copy.hint}
        </button>
        <button
          type="button"
          className={choice}
          onClick={() => {
            if (!taskId) return;
            setBusy(copy.imDone);
            void completeStep({ taskId, stepIndex }).then((result) => {
              setBusy("");
              if (!result || "error" in result) {
                setError(result && "error" in result && result.error ? result.error : copy.imDone);
                return;
              }
              if (result.done) {
                setDone(true);
                setStatus("done");
                return;
              }
              setStepIndex(result.stepIndex);
              setHintLevel(0);
              setStatus("doing");
              router.refresh();
            });
          }}
        >
          {copy.imDone}
        </button>
        <button
          type="button"
          className={status === "needs_you" ? choice : quiet}
          onClick={() => void remember({ stepIndex, hintLevel, status: "needs_you" })}
        >
          {copy.needYou}
        </button>
      </div>
      {error ? <p className="text-sun">{error}</p> : null}
    </div>
  );
}

const choice = "flex h-14 items-center justify-center rounded-full bg-hot px-4 text-lg";
const quiet = "flex h-14 items-center justify-center rounded-full bg-white/15 px-4 text-lg";

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { scanId?: string; error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Could not read this photo.");
  return payload;
}
