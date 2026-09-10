"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { ScoreCard } from "@/components/ScoreCard";
import { Spinner } from "@/components/Spinner";
import { TakeQuestion } from "@/components/take/take-question";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api";
import { api } from "@/lib/endpoints";
import { submitQuiz } from "@/lib/quizzes";
import type { PublicQuiz, Score } from "@/lib/types";

type Selections = Record<string, Set<string>>;

export default function TakeQuizPage() {
  const params = useParams<{ permalink: string }>();
  const permalink = params.permalink;

  const { data, error, isLoading } = useSWR<PublicQuiz>(
    api.publicQuiz(permalink),
  );

  const [selected, setSelected] = useState<Selections>({});
  const [score, setScore] = useState<Score | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggle = (questionId: string, type: "SINGLE" | "MULTIPLE") => (
    answerId: string,
    checked: boolean,
  ) => {
    setSelected((prev) => {
      const current = prev[questionId] ?? new Set<string>();
      const next = new Set(type === "SINGLE" ? [] : current);
      if (checked) next.add(answerId);
      else next.delete(answerId);
      return { ...prev, [questionId]: next };
    });
  };

  const dto = useMemo(
    () => ({
      answers: (data?.questions ?? []).map((q) => ({
        questionId: q.id,
        answerIds: [...(selected[q.id] ?? [])],
      })),
    }),
    [data, selected],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      setScore(await submitQuiz(permalink, dto));
    } catch (err) {
      setSubmitError((err as ApiError)?.message ?? "Could not submit answers");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelected({});
    setScore(null);
    setSubmitError(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Quiz not found</AlertTitle>
          <AlertDescription>
            This quiz doesn&apos;t exist or hasn&apos;t been published.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">{data.title}</h1>

      {score ? (
        <ScoreCard score={score} onRetry={reset} />
      ) : (
        <>
          <div className="grid gap-4">
            {data.questions.map((question, i) => (
              <TakeQuestion
                key={question.id}
                question={question}
                index={i}
                selected={selected[question.id] ?? new Set()}
                onToggle={toggle(question.id, question.type)}
              />
            ))}
          </div>

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not submit</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner /> : null}
            Submit answers
          </Button>
        </>
      )}
    </main>
  );
}
