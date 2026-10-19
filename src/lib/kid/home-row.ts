export function helperMark(input: { onBreak: boolean; role: "mom" | "dad" | "solo" | "break"; start: string }) {
  if (input.onBreak) return { icon: "🏖️", text: "10:00" };
  if (input.role === "solo") return { icon: "🐱", text: "5 min" };
  if (input.role === "dad") return { icon: "👨", text: input.start };
  return { icon: "👩", text: input.start };
}
