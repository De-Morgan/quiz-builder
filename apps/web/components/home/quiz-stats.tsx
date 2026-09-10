import type { QuizSummary } from "@/lib/types";

type Props = {
  quizzes: QuizSummary[];
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      <div className="font-heading text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}

export function QuizStats({ quizzes }: Props) {
  const published = quizzes.filter((quiz) => quiz.published).length;
  const drafts = quizzes.length - published;

  return (
    <div className="flex flex-wrap gap-3">
      <Stat label="Total" value={quizzes.length} />
      <Stat label="Published" value={published} />
      <Stat label="Drafts" value={drafts} />
    </div>
  );
}
