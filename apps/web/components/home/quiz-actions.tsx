import Link from "next/link";

import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/endpoints";
import type { QuizSummary } from "@/lib/types";

import { DeleteQuizDialog } from "./delete-quiz-dialog";
import { useQuizActions } from "./use-quiz-actions";

type Props = {
  quiz: QuizSummary;
  mutate: () => Promise<unknown>;
};

export function PublishedQuizActions({ quiz, mutate }: Props) {
  const { deleting, onDelete } = useQuizActions(quiz.id, mutate);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {quiz.permalink ? (
        <Button asChild variant="outline" size="sm">
          <a href={routes.take(quiz.permalink)} target="_blank" rel="noreferrer">
            Open
          </a>
        </Button>
      ) : null}
      <DeleteQuizDialog
        quizTitle={quiz.title}
        deleting={deleting}
        onDelete={onDelete}
      />
    </div>
  );
}

export function DraftQuizActions({ quiz, mutate }: Props) {
  const { publishing, deleting, onPublish, onDelete } = useQuizActions(
    quiz.id,
    mutate,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={routes.editQuiz(quiz.id)}>Edit</Link>
      </Button>
      <Button size="sm" onClick={onPublish} disabled={publishing}>
        {publishing ? <Spinner /> : null}
        Publish
      </Button>
      <DeleteQuizDialog
        quizTitle={quiz.title}
        deleting={deleting}
        onDelete={onDelete}
      />
    </div>
  );
}
