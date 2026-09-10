import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PublicQuiz } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useParams: () => ({ permalink: "abc123" }),
}));

const useSWR = vi.fn();
vi.mock("swr", () => ({ default: (key: string) => useSWR(key) }));

const submitQuiz = vi.fn();
vi.mock("@/lib/quizzes", () => ({
  submitQuiz: (...a: unknown[]) => submitQuiz(...a),
}));

import TakeQuizPage from "./page";

const quiz: PublicQuiz = {
  id: "quiz-1",
  title: "Sample Quiz",
  questions: [
    {
      id: "q1",
      text: "Pick one",
      type: "SINGLE",
      answers: [
        { id: "a1", text: "First" },
        { id: "a2", text: "Second" },
      ],
    },
    {
      id: "q2",
      text: "Pick many",
      type: "MULTIPLE",
      answers: [
        { id: "b1", text: "Alpha" },
        { id: "b2", text: "Beta" },
      ],
    },
  ],
};

function swrState(over: Record<string, unknown>) {
  useSWR.mockReturnValue({ data: undefined, error: undefined, isLoading: false, ...over });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("TakeQuizPage", () => {
  it("renders a not-found screen on error", () => {
    swrState({ error: { status: 404, message: "nope" } });
    render(<TakeQuizPage />);
    expect(screen.getByText(/quiz not found/i)).toBeInTheDocument();
  });

  it("walks the wizard, enforces single-selection, and submits the right DTO", async () => {
    const user = userEvent.setup();
    swrState({ data: quiz });
    submitQuiz.mockResolvedValue({ correct: 1, total: 2 });

    render(<TakeQuizPage />);

    const next = () => screen.getByRole("button", { name: /next question/i });
    expect(next()).toBeDisabled();

    await user.click(screen.getByLabelText("A) First"));
    await user.click(screen.getByLabelText("B) Second")); // replaces First
    expect(next()).toBeEnabled();
    await user.click(next());

    await user.click(await screen.findByLabelText("A) Alpha"));
    await user.click(screen.getByLabelText("B) Beta"));

    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => expect(submitQuiz).toHaveBeenCalledTimes(1));
    expect(submitQuiz).toHaveBeenCalledWith("abc123", {
      answers: [
        { questionId: "q1", answerIds: ["a2"] },
        { questionId: "q2", answerIds: ["b1", "b2"] },
      ],
    });

    expect(await screen.findByText("1/2")).toBeInTheDocument();
  });

  it("keeps a selection when navigating back", async () => {
    const user = userEvent.setup();
    swrState({ data: quiz });

    render(<TakeQuizPage />);

    await user.click(screen.getByLabelText("A) First"));
    await user.click(screen.getByRole("button", { name: /next question/i }));

    await user.click(await screen.findByRole("button", { name: /back/i }));
    expect(screen.getByLabelText("A) First")).toBeChecked();
  });

  it("resets to the first question when 'Try again' is clicked", async () => {
    const user = userEvent.setup();
    swrState({ data: quiz });
    submitQuiz.mockResolvedValue({ correct: 0, total: 2 });

    render(<TakeQuizPage />);

    await user.click(screen.getByLabelText("A) First"));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(await screen.findByLabelText("A) Alpha"));
    await user.click(screen.getByRole("button", { name: /^submit$/i }));

    await user.click(await screen.findByRole("button", { name: /try again/i }));
    expect(screen.getByText(/1\/2 questions/i)).toBeInTheDocument();
    expect(screen.getByLabelText("A) First")).not.toBeChecked();
  });
});
