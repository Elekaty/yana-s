"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { finishPhrase, saveRecording } from "@/app/kid/games/voice/actions";
import type { Copy } from "@/lib/i18n";
import { speakWhenDone } from "@/lib/speak";
import { createClient } from "@/lib/supabase/client";
import { recordingExtension } from "@/lib/voice/record";
import { RUNGS } from "@/lib/voice/packs";

const labels = {
  listen: "listen",
  whisper: "whisper",
  say: "sayIt",
  mochi: "sayMochi",
  record: "record",
} as const;

export function VoiceLadder({
  phraseId,
  text,
  lang,
  familyId,
  voiceOn,
  nextHref,
  backHref,
  copy,
  limitMs = 30_000,
}: {
  phraseId: string;
  text: string;
  lang: "fr" | "en";
  familyId: string;
  voiceOn: boolean;
  nextHref: string;
  backHref: string;
  copy: Copy;
  limitMs?: number;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const words = text.split(/\s+/);
  const [rungIndex, setRungIndex] = useState(0);
  const [word, setWord] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const saved = useRef(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const glow = useRef<HTMLDivElement>(null);
  const rung = RUNGS[rungIndex];

  useEffect(() => {
    if (rung !== "say" && rung !== "mochi") return;
    let stop = () => {};
    let cancelled = false;
    void listenLevel(glow.current, reduced).then((cleanup) => {
      if (cancelled) cleanup();
      else stop = cleanup;
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [rung, reduced]);

  async function onListen() {
    if (!voiceOn) return;
    for (let index = 0; index < words.length; index += 1) {
      setWord(index);
      await speakWhenDone({ text: words[index] ?? "", lang });
    }
    setWord(-1);
  }

  async function onRecord() {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
      return;
    }
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const media = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaRef.current = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: media.mimeType || "audio/webm" });
        void upload(blob);
      };
      mediaRef.current = media;
      media.start();
      setRecording(true);
      window.setTimeout(() => {
        if (media.state === "recording") media.stop();
      }, limitMs);
    } catch {
      setRecording(false);
    }
  }

  async function upload(blob: Blob) {
    setBusy(true);
    const path = `${familyId}/${crypto.randomUUID()}.${recordingExtension(blob.type)}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("voice").upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: false,
    });
    if (!error) {
      const savedNow = await saveRecording(path, phraseId);
      if (savedNow.ok) saved.current = true;
    }
    setBusy(false);
  }

  async function onNext() {
    if (rungIndex < RUNGS.length - 1) {
      setRungIndex(rungIndex + 1);
      setWord(-1);
      return;
    }
    setBusy(true);
    if (!saved.current) await finishPhrase(phraseId);
    router.push(nextHref);
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-lg">{copy[labels[rung]]}</p>
      <div ref={glow} className="mx-auto h-24 w-24 rounded-full bg-white" style={{ opacity: 0.35 }} aria-hidden />
      <p className="text-center text-3xl">
        {words.map((part, index) => (
          <span key={`${part}-${index}`} className={index === word ? "rounded-lg bg-sun px-1 text-plum" : undefined}>
            {part}{" "}
          </span>
        ))}
      </p>
      {rung === "record" ? (
        <button type="button" onClick={() => void onRecord()} disabled={busy} className="flex h-14 items-center justify-center rounded-full bg-hot text-2xl">
          {recording ? copy.stop : copy.record}
        </button>
      ) : (
        <button type="button" onClick={() => void onListen()} disabled={!voiceOn} className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum">
          {copy.listen}
        </button>
      )}
      <button type="button" onClick={() => void onNext()} disabled={busy} className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.next}
      </button>
      <Link href={backHref} className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    </div>
  );
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

async function listenLevel(glow: HTMLDivElement | null, reduced: boolean) {
  if (!glow || !navigator.mediaDevices) return () => {};
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audio = new AudioContext();
    const source = audio.createMediaStreamSource(stream);
    const analyser = audio.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const value of data) {
        const sample = (value - 128) / 128;
        sum += sample * sample;
      }
      const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
      glow.style.opacity = reduced ? "0.8" : String(0.35 + level * 0.65);
      glow.style.boxShadow = level > 0.08 ? "0 0 24px #FFD23F" : "none";
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stream.getTracks().forEach((track) => track.stop());
      void audio.close();
    };
  } catch {
    return () => {};
  }
}

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
