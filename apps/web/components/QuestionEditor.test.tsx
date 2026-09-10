import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { QuestionEditor } from "./QuestionEditor";
import { blankAnswer, useQuizForm } from "@/app/quizzes/_hooks/useQuizForm";
import type { QuestionInput } from "@/lib/types";

function Harness({
  type = "SINGLE",
  answers,
}: {
  type?: QuestionInput["type"];
  answers?: QuestionInput["answers"];
}) {
  const { state, actions } = useQuizForm({
    title: "",
    questions: [{ text: "", type, answers: answers ?? [blankAnswer(), blankAnswer()] }],
  });
  return (
    <QuestionEditor
      question={state.questions[0]!}
      index={0}
      actions={actions}
      errors={[]}
      canRemove={false}
    />
  );
}

describe("QuestionEditor", () => {
  it("renders radios for a SINGLE question", () => {
    render(<Harness type="SINGLE" />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("renders checkboxes for a MULTIPLE question", () => {
    render(<Harness type="MULTIPLE" />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("selecting a SINGLE answer marks exactly that one correct", async () => {
    const user = userEvent.setup();
    render(<Harness type="SINGLE" />);

    await user.click(screen.getByLabelText("Answer 2 is correct"));

    expect(screen.getByLabelText("Answer 2 is correct")).toBeChecked();
    expect(screen.getByLabelText("Answer 1 is correct")).not.toBeChecked();
  });

  it("disables 'Add answer' at the 5-answer ceiling", () => {
    render(
      <Harness
        type="MULTIPLE"
        answers={Array.from({ length: 5 }, (_, i) => ({
          text: `a${i}`,
          isCorrect: i === 0,
        }))}
      />,
    );
    expect(screen.getByRole("button", { name: /add answer/i })).toBeDisabled();
  });

  it("disables answer removal at the 2-answer floor", () => {
    render(<Harness type="MULTIPLE" />);
    expect(screen.getByRole("button", { name: "Remove answer 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove answer 2" })).toBeDisabled();
  });
});
