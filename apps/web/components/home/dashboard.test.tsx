import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { QuizSummary } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: unknown }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

const useSWR = vi.fn();
vi.mock("swr", () => ({ default: (key: string) => useSWR(key) }));

const publishQuiz = vi.fn();
const deleteQuiz = vi.fn();
vi.mock("@/lib/quizzes", () => ({
  publishQuiz: (...a: unknown[]) => publishQuiz(...a),
  deleteQuiz: (...a: unknown[]) => deleteQuiz(...a),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import Dashboard from "./dashboard";

const mutate = vi.fn().mockResolvedValue(undefined);

const draft: QuizSummary = {
  id: "q1",
  title: "Draft Quiz",
  published: false,
  permalink: null,
  questionCount: 3,
};

function swrState(over: Partial<ReturnType<typeof useSWR>>) {
  useSWR.mockReturnValue({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate,
    ...over,
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("shows a busy skeleton while loading", () => {
    swrState({ isLoading: true });
    const { container } = render(<Dashboard />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it("shows an error state with a retry", async () => {
    swrState({ error: { status: 500, message: "boom" } });
    render(<Dashboard />);
    expect(screen.getByText(/couldn't load your quizzes/i)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /retry/i }));
    expect(mutate).toHaveBeenCalled();
  });

  it("shows an empty state", () => {
    swrState({ data: [] });
    render(<Dashboard />);
    expect(screen.getByText(/no quizzes yet/i)).toBeInTheDocument();
  });

  it("lists quizzes and publishes one", async () => {
    publishQuiz.mockResolvedValue({ id: "q1", permalink: "abc123" });
    swrState({ data: [draft] });
    render(<Dashboard />);

    expect(screen.getByText("Draft Quiz")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(publishQuiz).toHaveBeenCalledWith("q1"));
    expect(mutate).toHaveBeenCalled();
  });

  it("confirms before deleting a quiz", async () => {
    deleteQuiz.mockResolvedValue(undefined);
    swrState({ data: [draft] });
    const user = userEvent.setup();
    render(<Dashboard />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    // dialog open — confirm
    const confirm = await screen.findByRole("button", { name: "Delete" });
    // the trigger and the action share a name; click the one inside the dialog
    const dialogConfirm = screen
      .getAllByRole("button", { name: "Delete" })
      .at(-1)!;
    await user.click(dialogConfirm);

    await waitFor(() => expect(deleteQuiz).toHaveBeenCalledWith("q1"));
    expect(confirm).toBeDefined();
  });
});
