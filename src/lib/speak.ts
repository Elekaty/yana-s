export type SpeakRequest = {
  text: string;
  lang: "fr" | "en";
};

/**
 * Scripted speech only. Call this from a click or tap.
 * Later this can play a reviewed audio file without changing callers.
 */
export function speak({ text, lang }: SpeakRequest) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
  utterance.pitch = 1.35;
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((voice) => voice.lang.toLowerCase().startsWith(lang === "fr" ? "fr" : "en"));
  if (match) utterance.voice = match;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function speakWhenDone({ text, lang }: SpeakRequest) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
    utterance.pitch = 1.35;
    utterance.rate = 0.92;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}
