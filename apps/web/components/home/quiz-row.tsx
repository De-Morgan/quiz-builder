import { PermalinkCopy } from "@/components/PermalinkCopy";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuizSummary } from "@/lib/types";

import { DraftQuizActions, PublishedQuizActions } from "./quiz-actions";

type Props = {
  quiz: QuizSummary;
  mutate: () => Promise<unknown>;
};

export function QuizRow({ quiz, mutate }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>
          {quiz.questionCount}{" "}
          {quiz.questionCount === 1 ? "question" : "questions"}
        </CardDescription>
        <CardAction>
          <Badge variant={quiz.published ? "default" : "secondary"}>
            {quiz.published ? "Published" : "Draft"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {quiz.published && quiz.permalink ? (
          <PermalinkCopy permalink={quiz.permalink} />
        ) : null}
        {quiz.published ? (
          <PublishedQuizActions quiz={quiz} mutate={mutate} />
        ) : (
          <DraftQuizActions quiz={quiz} mutate={mutate} />
        )}
      </CardContent>
    </Card>
  );
}
