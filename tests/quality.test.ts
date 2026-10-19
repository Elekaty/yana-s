import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parentLists, sharedCrash, sharedLoading } from "@/lib/parent/list-states";
import { decideGate } from "@/lib/parent-gate";

function pagesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...pagesUnder(full));
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
}

function routeFromPage(file: string, appDir: string) {
  const relative = path.relative(appDir, file).replaceAll("\\", "/").replace(/\/page\.tsx$/, "");
  const route = `/${relative.replace(/\/\([^/]+\)/g, "")}`;
  return route === "/" ? "/" : route.replace(/\/$/, "");
}

describe("route matrix", () => {
  const appDir = path.join(process.cwd(), "src", "app");
  const routes = pagesUnder(appDir).map((file) => routeFromPage(file, appDir));

  it("sends every parent and kid page to sign-in when signed out", () => {
    const gated = routes.filter((route) => route.startsWith("/parent") || route.startsWith("/kid"));
    expect(gated.length).toBeGreaterThan(20);
    for (const route of gated) {
      expect(decideGate(route, false, false).redirectTo).toBe("/login");
    }
  });

  it("sends a parent without the PIN to the unlock page and lets kid mode clear it", () => {
    for (const route of routes.filter((item) => item.startsWith("/parent") && item !== "/parent/unlock")) {
      expect(decideGate(route, true, false).redirectTo).toBe("/parent/unlock");
      expect(decideGate(route, true, true).redirectTo).toBeUndefined();
    }
    for (const route of routes.filter((item) => item.startsWith("/kid"))) {
      expect(decideGate(route, true, true).clearUnlock).toBe(true);
      expect(decideGate(route, true, true).redirectTo).toBeUndefined();
    }
  });

  it("keeps the voice and study pages from the empty stub", () => {
    const voice = readFileSync(path.join(appDir, "parent", "(gate)", "voice", "page.tsx"), "utf8");
    const study = readFileSync(path.join(appDir, "parent", "(gate)", "study", "page.tsx"), "utf8");
    const curriculum = readFileSync(path.join(appDir, "parent", "(gate)", "curriculum", "page.tsx"), "utf8");
    expect(voice).toContain("voice_recordings");
    expect(voice).toContain("Nothing is graded");
    expect(study).toContain("Only a parent can skip a break, with the PIN.");
    expect(study).toContain("saveStudy");
    expect(curriculum).toContain("monthPlan");
  });

  it("puts parent and kid mode beside the language switch and lists every parent page in the side menu", () => {
    const root = readFileSync(path.join(process.cwd(), "src", "app", "layout.tsx"), "utf8");
    const mode = readFileSync(path.join(process.cwd(), "src", "components", "mode-switch.tsx"), "utf8");
    const nav = readFileSync(path.join(process.cwd(), "src", "components", "parent", "parent-nav.tsx"), "utf8");
    expect(root).toContain("ModeSwitch");
    expect(root).toContain("LanguageBar");
    expect(mode).toContain("Parent");
    expect(mode).toContain("Kid");
    expect(nav).toContain("Show menu");
    expect(nav).toContain("Hide menu");
    for (const href of ["/parent/inbox", "/parent/calendar", "/parent/todo", "/parent/scan", "/parent/curriculum", "/parent/voice", "/parent/rewards", "/parent/study", "/parent/setup"]) {
      expect(nav).toContain(href);
    }
    expect(nav).not.toContain("More");
  });

  it("keeps a keyboard ring and a reduced-motion pause", () => {
    const css = readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("writes an empty line and an error line for each parent list", () => {
    const loading = readFileSync(path.join(process.cwd(), "src", "components", "parent", "screen-state.tsx"), "utf8");
    const crash = readFileSync(path.join(appDir, "parent", "(gate)", "error.tsx"), "utf8");
    const gateLoading = readFileSync(path.join(appDir, "parent", "(gate)", "loading.tsx"), "utf8");
    expect(loading).toContain(sharedLoading);
    expect(loading).toContain("Try again");
    expect(crash).toContain(sharedCrash);
    expect(gateLoading).toContain("LoadingState");
    expect(parentLists.length).toBeGreaterThan(10);
    for (const item of parentLists) {
      const text = readFileSync(path.join(process.cwd(), item.file), "utf8");
      expect(text, item.list).toContain(item.empty);
      const errorSource = item.error === sharedCrash ? crash : text;
      expect(errorSource, item.list).toContain(item.error);
    }
  });
});
