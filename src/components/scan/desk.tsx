"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { compressHomeworkPhoto } from "@/lib/scan/compress";
import { createClient } from "@/lib/supabase/client";

export type Question = {
  question_fr: string;
  question_en: string;
  expected_answer: string;
};

export type ScanCard = {
  id: string;
  status: string;
  createdAt: string;
  photoUrl: string | null;
  subject: string | null;
  objective: string | null;
  action: string | null;
  skill: string | null;
  confidence: number | null;
  unclearNote: string;
  flagged: boolean;
  questions: Question[];
  childStatus: string | null;
};

export function ScanDesk({
  familyId,
  stars,
  islandsDone,
  scans,
  childName,
}: {
  familyId: string;
  stars: number;
  islandsDone: number;
  scans: ScanCard[];
  childName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setBusy("Preparing the photo…");
    try {
      const blob = await compressHomeworkPhoto(file);
      const path = `${familyId}/${crypto.randomUUID()}.jpg`;
      setBusy("Saving the photo…");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("scans").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      setBusy("Queuing the reading…");
      const saved = await postJson("/api/scans", { imagePath: path });
      setBusy("Reading the page…");
      const reading = await postJson("/api/jobs/run", { scanId: saved.scanId });
      if (reading.error) throw new Error("Could not read this photo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this photo.");
    } finally {
      setBusy("");
      router.refresh();
    }
  }

  async function retry(scanId: string) {
    setError("");
    setBusy("Reading the page…");
    try {
      await postJson(`/api/scans/${scanId}/retry`, {});
      const reading = await postJson("/api/jobs/run", { scanId });
      if (reading.error) throw new Error("Could not read this photo.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read this photo.");
    } finally {
      setBusy("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{stars} stars</p>
          <h1 className="text-2xl font-semibold tracking-tight">Scan homework</h1>
        </div>
        <p className="text-sm text-muted-foreground">{islandsDone} of 4 islands done today</p>
      </div>

      <label
        className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void onFiles(event.dataTransfer.files);
        }}
      >
        <span className="text-base font-medium">Scan homework</span>
        <span className="mt-2 max-w-sm text-sm text-muted-foreground">
          Drop a photo here, or take one with the camera. It is compressed on this device before it is saved.
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={Boolean(busy)}
          onChange={(event) => {
            void onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {busy ? <p className="text-sm">{busy}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {scans.map((scan) => (
          <Card key={scan.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{scan.subject ?? statusLabel(scan.status)}</CardTitle>
                {scan.skill ? <CardDescription>{scan.skill}</CardDescription> : null}
                {scan.childStatus ? <CardDescription>{childLabel(childName, scan.childStatus)}</CardDescription> : null}
              </div>
              {needsCheck(scan) ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">Please check</span>
              ) : null}
            </div>
            {scan.status === "ready" && scan.objective ? (
              <div className="mt-4 space-y-3 text-sm">
                <p>{scan.objective}</p>
                <p className="text-muted-foreground">{scan.action}</p>
                {scan.unclearNote ? <p className="text-amber-800 dark:text-amber-200">{scan.unclearNote}</p> : null}
                <ol className="space-y-2">
                  {scan.questions.map((question) => (
                    <li key={question.question_fr}>
                      <p>{question.question_fr}</p>
                      <p className="text-muted-foreground">{question.question_en}</p>
                      <p>Answer: {question.expected_answer}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {scan.status === "failed" ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm">Could not read this photo.</p>
                <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => void retry(scan.id)}>
                  Retry
                </Button>
              </div>
            ) : null}
            {scan.status !== "ready" && scan.status !== "failed" ? (
              <p className="mt-4 text-sm text-muted-foreground">{statusLabel(scan.status)}</p>
            ) : null}
            {scan.photoUrl ? (
              <a className="mt-4 inline-block text-sm underline" href={scan.photoUrl} target="_blank" rel="noreferrer">
                Open the saved photo
              </a>
            ) : null}
          </Card>
        ))}
      </div>

      <Link className="inline-block text-sm text-muted-foreground underline" href="/parent/rewards">
        Reward vault
      </Link>
    </div>
  );
}

function childLabel(name: string, status: string) {
  if (status === "done") return `${name} is done`;
  if (status === "stuck") return `${name} is stuck`;
  if (status === "needs_you") return `${name} needs you`;
  if (status === "doing") return `${name} is working on this`;
  return "";
}

function needsCheck(scan: ScanCard) {
  return scan.status === "ready" && (scan.flagged || (scan.confidence ?? 1) < 0.6);
}

function statusLabel(status: string) {
  if (status === "reading") return "Reading the page…";
  if (status === "queued" || status === "saved") return "Waiting to read the photo…";
  if (status === "failed") return "Could not read";
  return "Homework";
}

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
