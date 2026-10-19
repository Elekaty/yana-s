"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { saveRecording } from "@/app/kid/games/voice/actions";
import type { Copy } from "@/lib/i18n";
import { speak } from "@/lib/speak";
import { createClient } from "@/lib/supabase/client";
import { recordingExtension } from "@/lib/voice/record";

export function WhatsNew({
  phraseId,
  question,
  starter,
  familyId,
  voiceOn,
  backHref,
  copy,
}: {
  phraseId: string;
  question: string;
  starter: string;
  familyId: string;
  voiceOn: boolean;
  backHref: string;
  copy: Copy;
}) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

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
        void upload(new Blob(chunks, { type: media.mimeType || "audio/webm" }));
      };
      mediaRef.current = media;
      media.start();
      setRecording(true);
      window.setTimeout(() => {
        if (media.state === "recording") media.stop();
      }, 20_000);
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
      const saved = await saveRecording(path, phraseId);
      if (saved.ok) setStars(saved.stars ?? 0);
    }
    setBusy(false);
  }

  if (stars !== null) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-3xl">{copy.doneTitle}</p>
        <p className="text-center text-2xl">
          {stars} {copy.stars}
        </p>
        <Link href={backHref} className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <p className="text-center text-3xl">{question}</p>
      <p className="text-center text-2xl text-sun">{starter}</p>
      <button
        type="button"
        disabled={!voiceOn}
        onClick={() => speak({ text: `${question} ${starter}`, lang: "fr" })}
        className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum"
      >
        {copy.listen}
      </button>
      <button type="button" onClick={() => void onRecord()} disabled={busy} className="flex h-16 items-center justify-center rounded-full bg-hot text-2xl">
        {recording ? copy.stop : copy.record}
      </button>
      <Link href={backHref} className="flex h-16 items-center justify-center rounded-full bg-white/15 text-2xl">
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
