import { describe, expect, it } from "vitest";

import { validateQuestion, validateQuiz } from "./validation";
import type { QuestionInput } from "./types";

const q = (over: Partial<QuestionInput> = {}): QuestionInput => ({
  text: "Capital of France?",
  type: "SINGLE",
  answers: [
    { text: "Paris", isCorrect: true },
    { text: "Lyon", isCorrect: false },
  ],
  ...over,
});

describe("validateQuestion", () => {
  it("passes a well-formed SINGLE question", () => {
    expect(validateQuestion(q())).toEqual([]);
  });

  it("flags SINGLE with two correct answers", () => {
    const errors = validateQuestion(
      q({
        answers: [
          { text: "Paris", isCorrect: true },
          { text: "Lyon", isCorrect: true },
        ],
      }),
    );
    expect(errors.join(" ")).toMatch(/exactly one correct/);
  });

  it("flags MULTIPLE with no correct answers", () => {
    const errors = validateQuestion(
      q({
        type: "MULTIPLE",
        answers: [
          { text: "Paris", isCorrect: false },
          { text: "Lyon", isCorrect: false },
        ],
      }),
    );
    expect(errors.join(" ")).toMatch(/at least one correct/);
  });

  it("flags fewer than 2 answers", () => {
    const errors = validateQuestion(
      q({ answers: [{ text: "Paris", isCorrect: true }] }),
    );
    expect(errors.join(" ")).toMatch(/between 2 and 5/);
  });

  it("flags duplicate answer text (case/space-insensitive)", () => {
    const errors = validateQuestion(
      q({
        answers: [
          { text: "Paris", isCorrect: true },
          { text: " paris ", isCorrect: false },
        ],
      }),
    );
    expect(errors.join(" ")).toMatch(/unique/);
  });
});

describe("validateQuiz", () => {
  it("passes a minimal valid quiz", () => {
    expect(validateQuiz({ title: "Geo", questions: [q()] })).toEqual([]);
  });

  it("flags an empty title and zero questions", () => {
    const errors = validateQuiz({ title: "  ", questions: [] });
    expect(errors).toContain("Title is required");
    expect(errors.join(" ")).toMatch(/between 1 and 10 questions/);
  });

  it("flags more than 10 questions", () => {
    const errors = validateQuiz({
      title: "Big",
      questions: Array.from({ length: 11 }, (_, i) => q({ text: `Q${i}` })),
    });
    expect(errors.join(" ")).toMatch(/between 1 and 10 questions/);
  });

  it("flags duplicate question text", () => {
    const errors = validateQuiz({ title: "Dup", questions: [q(), q()] });
    expect(errors.join(" ")).toMatch(/Question texts must be unique/);
  });
});
