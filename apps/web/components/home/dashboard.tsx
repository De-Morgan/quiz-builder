import Link from "next/link";
import { PlusIcon } from "lucide-react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { api, routes } from "@/lib/endpoints";
import type { QuizSummary } from "@/lib/types";

import { QuizListBody } from "./quiz-list-body";
import { QuizStats } from "./quiz-stats";

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<QuizSummary[]>(api.quizzes);
  const hasQuizzes = !isLoading && !error && data && data.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Your quizzes
          </h1>
          <p className="text-muted-foreground text-sm">
            Create quizzes, publish them, and share the link with anyone.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.newQuiz}>
            <PlusIcon />
            New quiz
          </Link>
        </Button>
      </header>

      {hasQuizzes ? <QuizStats quizzes={data} /> : null}

      <QuizListBody
        data={data}
        error={error}
        isLoading={isLoading}
        mutate={mutate}
      />
    </div>
  );
}
