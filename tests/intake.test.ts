import { describe, expect, it } from "vitest";
import { CLASSIFY_SYSTEM_PROMPT } from "@/lib/intake/prompt";
import {
  afterClassifyError,
  extractPlainText,
  familyCodeFromAddress,
  incomingHash,
  parseLinkCode,
  senderAllowed,
} from "@/lib/intake/mail";
import { parseClassifyResult } from "@/lib/intake/schema";
import { parseTelegramNote } from "@/lib/intake/telegram";

describe("school intake", () => {
  it("links a chat from the family code and ignores other text", () => {
    expect(parseLinkCode("/link ab12cd34")).toBe("ab12cd34");
    expect(parseLinkCode("/link@MochiBot AB12CD34")).toBe("ab12cd34");
    expect(parseLinkCode("Bonjour")).toBe("");
  });

  it("reads a telegram photo and a caption", () => {
    const note = parseTelegramNote({
      message: {
        message_id: 9,
        chat: { id: -100, title: "CE1" },
        caption: "Sortie vendredi",
        photo: [
          { file_id: "small", file_unique_id: "u1" },
          { file_id: "large", file_unique_id: "u2" },
        ],
      },
    });
    expect(note?.chatId).toBe("-100");
    expect(note?.text).toBe("Sortie vendredi");
    expect(note?.files[0]?.uniqueId).toBe("u2");
  });

  it("treats the same note as one hash and a new photo as another", () => {
    const first = incomingHash("Réunion demain", ["file-a"], "tg:1");
    expect(incomingHash("  réunion   demain ", ["file-a"], "tg:2")).toBe(first);
    expect(incomingHash("Réunion demain", ["file-b"], "tg:3")).not.toBe(first);
  });

  it("accepts only an allowed school sender", () => {
    expect(senderAllowed("Teacher <Teacher@School.fr>", ["teacher@school.fr"])).toBe(true);
    expect(senderAllowed("other@school.fr", ["teacher@school.fr"])).toBe(false);
    expect(familyCodeFromAddress("ab12cd34@school.example")).toBe("ab12cd34");
  });

  it("pulls the plain sentence out of a forwarded email", () => {
    const raw = [
      "From: teacher@school.fr",
      "Subject: Sortie",
      "Content-Type: multipart/alternative; boundary=xyz",
      "",
      "--abc",
      "Content-Type: text/plain",
      "",
      "La sortie est vendredi.",
      "--abc--",
    ].join("\n");
    expect(extractPlainText(raw)).toBe("La sortie est vendredi.");
  });

  it("keeps the original when a reading fails three times", () => {
    expect(afterClassifyError(1)).toEqual({ job: "queued", read: "saved" });
    expect(afterClassifyError(3)).toEqual({ job: "failed", read: "failed" });
    expect(parseClassifyResult({ title: "Trip", summary_en: "The trip is on Friday." }).title).toBe("Trip");
    expect(CLASSIFY_SYSTEM_PROMPT).not.toContain("Yana");
  });
});
