import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { QuizForm } from "./QuizForm";

describe("QuizForm", () => {
  it("keeps submit disabled and shows an error summary while invalid", () => {
    render(<QuizForm onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: /save quiz/i })).toBeDisabled();
    expect(screen.getByText(/fix these before saving/i)).toBeInTheDocument();
  });

  it("surfaces a server-side formError", () => {
    render(<QuizForm onSubmit={vi.fn()} formError="Title already taken" />);
    expect(screen.getByText("Title already taken")).toBeInTheDocument();
  });

  it("submits the built DTO once the form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<QuizForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Quiz title"), "Capitals");
    await user.type(screen.getByLabelText("Question text"), "Capital of France?");
    await user.type(screen.getByPlaceholderText("Answer 1"), "Paris");
    await user.type(screen.getByPlaceholderText("Answer 2"), "Lyon");
    await user.click(screen.getByLabelText("Answer 1 is correct"));

    const submit = screen.getByRole("button", { name: /save quiz/i });
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Capitals",
      questions: [
        {
          text: "Capital of France?",
          type: "SINGLE",
          answers: [
            { text: "Paris", isCorrect: true },
            { text: "Lyon", isCorrect: false },
          ],
        },
      ],
    });
  });
});
