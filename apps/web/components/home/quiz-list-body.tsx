import type { QuizSummary } from "@/lib/types";

import {
  EmptyQuizzes,
  QuizListError,
  QuizListSkeleton,
} from "./quiz-list-states";
import { QuizRow } from "./quiz-row";

type Props = {
  data: QuizSummary[] | undefined;
  error: unknown;
  isLoading: boolean;
  mutate: () => Promise<unknown>;
};

// Drafts first — they're the ones that still need the author's attention.
function sortQuizzes(quizzes: QuizSummary[]): QuizSummary[] {
  return [...quizzes].sort((a, b) => Number(a.published) - Number(b.published));
}

export function QuizListBody({ data, error, isLoading, mutate }: Props) {
  if (isLoading) return <QuizListSkeleton />;
  if (error) return <QuizListError error={error} onRetry={mutate} />;
  if (!data || data.length === 0) return <EmptyQuizzes />;

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {sortQuizzes(data).map((quiz) => (
        <li key={quiz.id}>
          <QuizRow quiz={quiz} mutate={mutate} />
        </li>
      ))}
    </ul>
  );
}
