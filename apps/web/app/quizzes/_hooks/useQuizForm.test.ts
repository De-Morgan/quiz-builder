import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useQuizForm } from "./useQuizForm";
import type { QuizFormState } from "./useQuizForm";

const multipleWithTwoCorrect: QuizFormState = {
  title: "",
  questions: [
    {
      text: "Pick some",
      type: "MULTIPLE",
      answers: [
        { text: "a", isCorrect: true },
        { text: "b", isCorrect: true },
        { text: "c", isCorrect: false },
      ],
    },
  ],
};

describe("useQuizForm", () => {
  it("keeps only the first correct answer when switching MULTIPLE → SINGLE", () => {
    const { result } = renderHook(() => useQuizForm(multipleWithTwoCorrect));

    act(() => result.current.actions.setQuestionType(0, "SINGLE"));

    const correct = result.current.state.questions[0]!.answers.filter(
      (a) => a.isCorrect,
    );
    expect(correct).toHaveLength(1);
    expect(result.current.state.questions[0]!.answers[0]!.isCorrect).toBe(true);
  });

  it("makes SINGLE correctness exclusive", () => {
    const { result } = renderHook(() => useQuizForm(multipleWithTwoCorrect));

    act(() => result.current.actions.setQuestionType(0, "SINGLE"));
    act(() => result.current.actions.setAnswerCorrect(0, 2, true));

    const flags = result.current.state.questions[0]!.answers.map((a) => a.isCorrect);
    expect(flags).toEqual([false, false, true]);
  });

  it("adds and removes answers", () => {
    const { result } = renderHook(() => useQuizForm());

    act(() => result.current.actions.addAnswer(0));
    expect(result.current.state.questions[0]!.answers).toHaveLength(3);

    act(() => result.current.actions.removeAnswer(0, 2));
    expect(result.current.state.questions[0]!.answers).toHaveLength(2);
  });

  it("adds and removes questions", () => {
    const { result } = renderHook(() => useQuizForm());

    act(() => result.current.actions.addQuestion());
    expect(result.current.state.questions).toHaveLength(2);

    act(() => result.current.actions.removeQuestion(1));
    expect(result.current.state.questions).toHaveLength(1);
  });
});
