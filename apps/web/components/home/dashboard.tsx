import Link from "next/link";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { api, routes } from "@/lib/endpoints";
import type { QuizSummary } from "@/lib/types";

import { QuizListBody } from "./quiz-list-body";

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<QuizSummary[]>(api.quizzes);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your quizzes</h1>
        <Button asChild>
          <Link href={routes.newQuiz}>New quiz</Link>
        </Button>
      </div>

      <QuizListBody
        data={data}
        error={error}
        isLoading={isLoading}
        mutate={mutate}
      />
    </main>
  );
}
