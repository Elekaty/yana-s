import { weeklyDigest } from "@/lib/parent/progress";

export function arrivalTargets(parents: { id: string }[], alreadySent: string[]) {
  return parents.filter((parent) => !alreadySent.includes(parent.id)).map((parent) => parent.id);
}

export function digestBody(kind: "important" | "fyi", titles: string[]) {
  const lines = titles.map((title) => title.trim()).filter(Boolean).slice(0, 8);
  const head = kind === "important" ? "Tonight's important notes" : "This week's school notes";
  if (lines.length === 0) return `${head}: nothing new.`;
  return `${head}:\n${lines.map((line) => `• ${line}`).join("\n")}`;
}

export function progressBody(input: {
  childName: string;
  homework: number;
  games: number;
  logic: number;
  voice: number;
  stories: number;
  stars: number;
  hints: number;
  strong: number;
  practicing: number;
}) {
  return weeklyDigest(input);
}

export function customSnoozeReply() {
  return "Open the app to choose a custom time.";
}

export function reminderButtons(id: string) {
  return [
    { text: "Done", data: `r:${id}:done` },
    { text: "30", data: `r:${id}:30` },
    { text: "45", data: `r:${id}:45` },
    { text: "60", data: `r:${id}:60` },
    { text: "Custom", data: `r:${id}:custom` },
  ];
}
