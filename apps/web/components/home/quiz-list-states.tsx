import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api";
import { routes } from "@/lib/endpoints";

export function QuizListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function QuizListError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Couldn&apos;t load your quizzes</AlertTitle>
      <AlertDescription className="space-x-2">
        <span> {(error as ApiError)?.message ?? "Something went wrong."}</span>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-fit"
          onClick={onRetry}
        >
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function EmptyQuizzes() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No quizzes yet</CardTitle>
        <CardDescription>
          Create your first quiz to share it with others.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href={routes.newQuiz}>Create your first quiz</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
