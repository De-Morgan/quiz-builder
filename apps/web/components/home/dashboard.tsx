import Link from "next/link";
import { PlusIcon } from "lucide-react";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { api, routes } from "@/lib/endpoints";
import type { QuizSummary } from "@/lib/types";

import { QuizListBody } from "./quiz-list-body";
import { QuizStats } from "./quiz-stats";
import { DashboardHeader } from "./dashboard-header";

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<QuizSummary[]>(api.quizzes);
  const hasQuizzes = !isLoading && !error && data && data.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <DashboardHeader />
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
