import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Score } from "@/lib/types";

type Props = {
  score: Score;
  onRetry: () => void;
};

export function ScoreCard({ score, onRetry }: Props) {
  const { correct, total } = score;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your score</CardTitle>
        <CardDescription>
          You answered {correct}/{total} questions correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">
          {correct}/{total}
        </p>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
}
