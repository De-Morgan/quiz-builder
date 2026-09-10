"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { ScoreCard } from "@/components/ScoreCard";
import { Spinner } from "@/components/Spinner";
import { QuizProgress } from "@/components/take/quiz-progress";
import { TakeQuestion } from "@/components/take/take-question";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  const [step, setStep] = useState(0);
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
    setStep(0);
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

  if (score) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold">{data.title}</h1>
        <ScoreCard score={score} onRetry={reset} />
      </main>
    );
  }

  const total = data.questions.length;
  const safeStep = Math.min(step, total - 1);
  const question = data.questions[safeStep];
  const isLast = safeStep === total - 1;
  const answered = !!question && (selected[question.id]?.size ?? 0) > 0;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">{data.title}</h1>

      <Card>
        <CardContent className="space-y-6">
          <QuizProgress current={safeStep + 1} total={total} />

          {question ? (
            <TakeQuestion
              question={question}
              index={safeStep}
              selected={selected[question.id] ?? new Set()}
              onToggle={toggle(question.id, question.type)}
            />
          ) : null}

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not submit</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>

        <CardFooter className="justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={safeStep === 0}
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={handleSubmit} disabled={!answered || submitting}>
              {submitting ? <Spinner /> : null}
              Submit
            </Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!answered}>
              Next Question
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
