import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STORIES } from "@/lib/stories/library";
import { allPhrases, newPromptFor, promptForToday, RUNGS } from "@/lib/voice/packs";
import { isFamilyVoicePath, recordingExtension } from "@/lib/voice/record";

describe("say it out loud", () => {
  it("keeps five rungs and unique phrases", () => {
    expect(RUNGS).toEqual(["listen", "whisper", "say", "mochi", "record"]);
    const ids = allPhrases().map((phrase) => phrase.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(allPhrases().every((phrase) => phrase.fr && phrase.en)).toBe(true);
  });

  it("rotates the daily question", () => {
    expect(newPromptFor(0).id).toBe(newPromptFor(3).id);
    expect(newPromptFor(1).starter.length).toBeGreaterThan(0);
    expect(promptForToday(Date.UTC(2026, 0, 1)).id).toBe(newPromptFor(1).id);
  });

  it("only accepts a recording stored in this family's folder", () => {
    const family = "11111111-1111-1111-1111-111111111111";
    expect(isFamilyVoicePath(family, `${family}/clip.webm`)).toBe(true);
    expect(isFamilyVoicePath(family, `${family}/nested/clip.webm`)).toBe(false);
    expect(isFamilyVoicePath(family, `other/clip.webm`)).toBe(false);
    expect(isFamilyVoicePath(family, `${family}/../clip.webm`)).toBe(false);
    expect(recordingExtension("audio/mp4")).toBe("mp4");
    expect(recordingExtension("audio/webm")).toBe("webm");
  });
});

describe("stories", () => {
  it("ships thirty original stories in the app and in SQL", () => {
    const sql = readFileSync("supabase/migrations/0008_stories.sql", "utf8");
    expect(sql.startsWith("-- 0008 stories")).toBe(true);
    expect(STORIES).toHaveLength(30);
    const slugs = STORIES.map((story) => story.slug);
    expect(new Set(slugs).size).toBe(30);
    for (const story of STORIES) {
      expect(sql).toContain(`'${story.slug}'`);
      expect(story.pages.length).toBeGreaterThan(0);
      expect(story.pages.every((page) => page.fr && page.en)).toBe(true);
    }
  });
});
