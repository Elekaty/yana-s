import { mochiSend, speakMs } from "@/lib/mochi/bus";

export type SpeakRequest = {
  text: string;
  lang: "fr" | "en";
};

/**
 * Scripted speech only. Call this from a click or tap.
 * Later this can play a reviewed audio file without changing callers.
 */
let muted = false;
let talkToken = 0;

export function setSpeakMuted(value: boolean) {
  muted = value;
  if (value && typeof window !== "undefined") {
    talkToken += 1;
    mochiSend({ type: "talk", on: false });
    window.speechSynthesis?.cancel();
  }
}

export function speak({ text, lang }: SpeakRequest) {
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
  utterance.pitch = 1.35;
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((voice) => voice.lang.toLowerCase().startsWith(lang === "fr" ? "fr" : "en"));
  if (match) utterance.voice = match;
  const token = ++talkToken;
  utterance.onend = () => {
    if (token === talkToken) mochiSend({ type: "talk", on: false });
  };
  utterance.onerror = () => {
    if (token === talkToken) mochiSend({ type: "talk", on: false });
  };
  window.speechSynthesis.cancel();
  mochiSend({ type: "talk", on: true });
  window.setTimeout(() => {
    if (token === talkToken) mochiSend({ type: "talk", on: false });
  }, speakMs(text));
  window.speechSynthesis.speak(utterance);
}

export function speakWhenDone({ text, lang }: SpeakRequest) {
  return new Promise<void>((resolve) => {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
    utterance.pitch = 1.35;
    utterance.rate = 0.92;
    const token = ++talkToken;
    utterance.onend = () => {
      if (token === talkToken) mochiSend({ type: "talk", on: false });
      resolve();
    };
    utterance.onerror = () => {
      if (token === talkToken) mochiSend({ type: "talk", on: false });
      resolve();
    };
    window.speechSynthesis.cancel();
    mochiSend({ type: "talk", on: true });
    window.setTimeout(() => {
      if (token === talkToken) mochiSend({ type: "talk", on: false });
    }, speakMs(text));
    window.speechSynthesis.speak(utterance);
  });
}
