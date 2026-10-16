export const PADS = [
  { id: "C4", label: "Do", freq: 261.63 },
  { id: "D4", label: "Ré", freq: 293.66 },
  { id: "E4", label: "Mi", freq: 329.63 },
  { id: "F4", label: "Fa", freq: 349.23 },
  { id: "G4", label: "Sol", freq: 392 },
  { id: "A4", label: "La", freq: 440 },
  { id: "B4", label: "Si", freq: 493.88 },
  { id: "C5", label: "Do", freq: 523.25 },
] as const;

export const FRERE_JACQUES = [
  "C4", "D4", "E4", "C4",
  "C4", "D4", "E4", "C4",
  "E4", "F4", "G4",
  "E4", "F4", "G4",
  "G4", "A4", "G4", "F4", "E4", "C4",
  "G4", "A4", "G4", "F4", "E4", "C4",
  "C4", "G4", "C4",
  "C4", "G4", "C4",
] as const;

export function songMatches(notes: string[]) {
  return notes.length === FRERE_JACQUES.length && notes.every((note, index) => note === FRERE_JACQUES[index]);
}

let audio: AudioContext | null = null;

export function playNote(freq: number) {
  if (typeof window === "undefined") return;
  const context = audio ?? new AudioContext();
  audio = context;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.value = 0.06;
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start();
  osc.stop(context.currentTime + 0.2);
}
