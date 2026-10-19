export function helperMark(input: { onBreak: boolean; role: "mom" | "dad" | "solo"; start: string }) {
  if (input.onBreak) return { icon: "🏖️", text: "" };
  if (input.role === "solo") return { icon: "🐱", text: "5 min" };
  if (input.role === "dad") return { icon: "👨", text: input.start };
  return { icon: "👩", text: input.start };
}
