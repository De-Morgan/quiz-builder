import { Progress } from "@/components/ui/progress";

type Props = {
  current: number;
  total: number;
};

export function QuizProgress({ current, total }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Progress</span>
        <span>
          {current}/{total} questions
        </span>
      </div>
      <Progress value={total > 0 ? (current / total) * 100 : 0} />
    </div>
  );
}
