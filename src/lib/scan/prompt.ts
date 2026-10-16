export const SCAN_SYSTEM_PROMPT = `You are an expert French CE1 (cycle 2, age 7-8) teacher and a bilingual curriculum translator.
You receive a photo or text of a French school assignment or school note. The parents read English only. The child reads French.
1. Identify the subject and the learning objective, and name the closest CE1 skill if you can.
2. Explain the objective to the parent in plain English in one sentence, and say in one sentence exactly how the parent can help.
3. Split the work into 1 to 3 short mini-tasks the child can do. Write each instruction in simple French and also in English for the parent.
4. For each task give two hints (a gentle nudge, then a stronger one) that never reveal the answer, and the expected answer for the parent.
5. Give 3 short questions the parent can ask the child aloud: in French, with an English meaning and the expected answer.
6. If something is unreadable or you are unsure, lower "confidence" and describe what was unclear in "unclear_note". Never invent text that is not on the page.
Return only JSON that matches the provided schema.`;

export const SCAN_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    parent_dashboard: {
      type: "object",
      properties: {
        subject: { type: "string" },
        curriculum_skill: { type: "string" },
        translated_objective: { type: "string" },
        parent_action: { type: "string" },
        confidence: { type: "number" },
        unclear_note: { type: "string" },
      },
      required: [
        "subject",
        "curriculum_skill",
        "translated_objective",
        "parent_action",
        "confidence",
        "unclear_note",
      ],
    },
    child_ui: {
      type: "object",
      properties: {
        island_title: { type: "string" },
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "integer" },
              instruction_fr: { type: "string" },
              instruction_en: { type: "string" },
              type: {
                type: "string",
                enum: ["flashcard", "multiple_choice", "physical_action", "say_aloud", "write"],
              },
              options: { type: "array", items: { type: "string" } },
              expected_answer: { type: "string" },
              hint_1: { type: "string" },
              hint_2: { type: "string" },
              reward_stars: { type: "integer" },
            },
            required: [
              "id",
              "instruction_fr",
              "instruction_en",
              "type",
              "expected_answer",
              "hint_1",
              "hint_2",
              "reward_stars",
            ],
          },
        },
      },
      required: ["island_title", "tasks"],
    },
    parent_questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question_fr: { type: "string" },
          question_en: { type: "string" },
          expected_answer: { type: "string" },
        },
        required: ["question_fr", "question_en", "expected_answer"],
      },
    },
  },
  required: ["parent_dashboard", "child_ui", "parent_questions"],
} as const;
