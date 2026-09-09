"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { PermalinkCopy } from "@/components/PermalinkCopy";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/Spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, routes } from "@/lib/endpoints";
import type { ApiError } from "@/lib/api";
import { deleteQuiz, publishQuiz } from "@/lib/quizzes";
import type { QuizSummary } from "@/lib/types";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<QuizSummary[]>(api.quizzes);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your quizzes</h1>
        <Button asChild>
          <Link href={routes.newQuiz}>New quiz</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load your quizzes</AlertTitle>
          <AlertDescription>
            {(error as ApiError)?.message ?? "Something went wrong."}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-fit"
              onClick={() => mutate()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : !data || data.length === 0 ? (
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
      ) : (
        <ul className="space-y-3">
          {data.map((quiz) => (
            <li key={quiz.id}>
              <QuizRow quiz={quiz} mutate={mutate} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

type RowProps = {
  quiz: QuizSummary;
  mutate: () => Promise<unknown>;
};

function QuizRow({ quiz, mutate }: RowProps) {
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onPublish = async () => {
    setPublishing(true);
    try {
      await publishQuiz(quiz.id);
      toast.success("Quiz published");
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e?.status === 409 ? "Quiz is already published" : e?.message ?? "Publish failed",
      );
    } finally {
      setPublishing(false);
      await mutate();
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuiz(quiz.id);
      toast.success("Quiz deleted");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
      await mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <CardDescription>
          {quiz.questionCount}{" "}
          {quiz.questionCount === 1 ? "question" : "questions"}
        </CardDescription>
        <CardAction>
          <Badge variant={quiz.published ? "default" : "secondary"}>
            {quiz.published ? "Published" : "Draft"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {quiz.published && quiz.permalink ? (
          <PermalinkCopy permalink={quiz.permalink} />
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {quiz.published ? (
            quiz.permalink ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={routes.take(quiz.permalink)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </Button>
            ) : null
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={routes.editQuiz(quiz.id)}>Edit</Link>
              </Button>
              <Button size="sm" onClick={onPublish} disabled={publishing}>
                {publishing ? <Spinner /> : null}
                Publish
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? <Spinner /> : null}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{quiz.title}&rdquo; will be permanently removed. This
                  can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
