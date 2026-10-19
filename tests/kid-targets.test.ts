import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...filesUnder(full));
    else if (entry.endsWith(".tsx")) found.push(full);
  }
  return found;
}

function channel(hex: string, index: number) {
  const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrast(foreground: string, background: string) {
  const light = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  const lighter = Math.max(light(foreground), light(background));
  const darker = Math.min(light(foreground), light(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("kid targets", () => {
  it("keeps kid controls at 64px and shows a keyboard ring", () => {
    const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    expect(css).toContain("min-height: 64px");
    expect(css).toContain("min-width: 64px");
    expect(css).toContain(".kid :focus-visible");
    expect(css).toContain("prefers-reduced-motion: reduce");
    const roots = [path.join(process.cwd(), "src", "app", "kid"), path.join(process.cwd(), "src", "components", "kid")];
    const small = roots.flatMap(filesUnder).filter((file) => /\bh-1[0-4]\b|\bw-1[0-4]\b/.test(readFileSync(file, "utf8")));
    expect(small).toEqual([]);
  });

  it("keeps the kid colors readable at button size", () => {
    expect(contrast("#ffffff", "#2A0B4A")).toBeGreaterThan(4.5);
    expect(contrast("#2A0B4A", "#FFD23F")).toBeGreaterThan(4.5);
    expect(contrast("#ffffff", "#7C3AED")).toBeGreaterThan(4.5);
    expect(contrast("#ffffff", "#FF2E93")).toBeGreaterThan(3);
  });
});
