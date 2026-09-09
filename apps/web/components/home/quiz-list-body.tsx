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

export function QuizListBody({ data, error, isLoading, mutate }: Props) {
  if (isLoading) return <QuizListSkeleton />;
  if (error) return <QuizListError error={error} onRetry={mutate} />;
  if (!data || data.length === 0) return <EmptyQuizzes />;

  return (
    <ul className="space-y-3">
      {data.map((quiz) => (
        <li key={quiz.id}>
          <QuizRow quiz={quiz} mutate={mutate} />
        </li>
      ))}
    </ul>
  );
}
