const A4 = 440;

const NOTE: Record<string, number> = {
  G3: midi(55),
  C4: midi(60),
  D4: midi(62),
  E4: midi(64),
  F4: midi(65),
  G4: midi(67),
  A4: midi(69),
};

const FRERE = [
  "C4", "D4", "E4", "C4", "C4", "D4", "E4", "C4",
  "E4", "F4", "G4", "E4", "F4", "G4",
  "G4", "A4", "G4", "F4", "E4", "C4", "G4", "A4", "G4", "F4", "E4", "C4",
  "C4", "G3", "C4", "C4", "G3", "C4",
];

const LUNE = [
  "C4", "C4", "C4", "D4", "E4",
  "D4", "C4", "D4", "E4", "D4",
  "C4", "E4", "E4", "E4", "D4",
  "C4", "D4", "E4", "D4", "C4",
];

let stopCurrent: (() => void) | null = null;

export function playTune(id: "frere" | "lune") {
  if (typeof window === "undefined") return;
  stopCurrent?.();
  const Ctx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const context = new Ctx();
  const notes = id === "frere" ? FRERE : LUNE;
  let when = context.currentTime + 0.05;
  for (const note of notes) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = NOTE[note] ?? A4;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.08, when + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.38);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(when);
    osc.stop(when + 0.4);
    when += 0.42;
  }
  stopCurrent = () => {
    void context.close();
    stopCurrent = null;
  };
}

export function stopTune() {
  stopCurrent?.();
}

function midi(note: number) {
  return A4 * 2 ** ((note - 69) / 12);
}
