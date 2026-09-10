import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api";
import { routes } from "@/lib/endpoints";

export function QuizListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
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
    <Card className="py-12">
      <CardContent className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
        <span
          className="flex size-11 items-center justify-center rounded-full bg-muted"
          aria-hidden="true"
        >
          <FileQuestionIcon className="size-5 text-muted-foreground" />
        </span>
        <CardTitle>No quizzes yet</CardTitle>
        <CardDescription>
          Create your first quiz to share it with others.
        </CardDescription>
        <Button asChild className="mt-2">
          <Link href={routes.newQuiz}>Create your first quiz</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
