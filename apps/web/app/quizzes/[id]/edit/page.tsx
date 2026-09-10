"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";

import { quizDetailToForm } from "@/app/quizzes/_hooks/useQuizForm";
import { QuizForm } from "@/components/QuizForm";
import { RequireAuth } from "@/components/RequireAuth";
import { Spinner } from "@/components/Spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api";
import { api, routes } from "@/lib/endpoints";
import { publishQuiz, updateQuiz } from "@/lib/quizzes";
import type { CreateQuizDto, QuizDetail } from "@/lib/types";

export default function EditQuizPage() {
  return (
    <RequireAuth>
      <EditQuiz />
    </RequireAuth>
  );
}

function EditQuiz() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<QuizDetail>(api.quiz(id));

  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Published quizzes are immutable — bounce back to the dashboard.
  useEffect(() => {
    if (data?.published) {
      toast.error("Published quizzes can't be edited");
      router.replace(routes.home);
    }
  }, [data?.published, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (error || !data) {
    const notFound = (error as ApiError)?.status === 404;
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>
            {notFound ? "Quiz not found" : "Couldn't load this quiz"}
          </AlertTitle>
          <AlertDescription className="space-x-2">
            <span>
              {notFound
                ? "It may have been deleted."
                : ((error as ApiError)?.message ?? "Something went wrong.")}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-fit"
              onClick={() => router.push(routes.home)}
            >
              Back to dashboard
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (data.published) return null; // redirect in flight

  const handleSubmit = async (dto: CreateQuizDto) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const updated = await updateQuiz(id, dto);
      await mutate(updated, { revalidate: false });
      toast.success("Quiz saved");
    } catch (err) {
      const e = err as ApiError;
      if (e?.status === 409) {
        toast.error("This quiz is published");
        router.replace(routes.home);
        return;
      }
      setFormError(e?.message ?? "Could not save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await publishQuiz(id);
      await globalMutate(api.quizzes);
      toast.success("Quiz published");
      router.push(routes.home);
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e?.status === 409
          ? "Quiz is already published"
          : (e?.message ?? "Publish failed"),
      );
      await mutate();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Edit quiz</h1>
        <Button
          variant="secondary"
          disabled={publishing || submitting}
          onClick={handlePublish}
        >
          {publishing ? <Spinner /> : null}
          Publish
        </Button>
      </div>

      <QuizForm
        key={data.id}
        initial={quizDetailToForm(data)}
        submitting={submitting}
        submitLabel="Save changes"
        formError={formError}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
