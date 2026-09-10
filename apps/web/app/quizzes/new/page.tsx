"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";

import { RequireAuth } from "@/components/RequireAuth";
import { QuizForm } from "@/components/QuizForm";
import type { ApiError } from "@/lib/api";
import { api, routes } from "@/lib/endpoints";
import { createQuiz } from "@/lib/quizzes";
import type { CreateQuizDto } from "@/lib/types";

export default function NewQuizPage() {
  return (
    <RequireAuth>
      <NewQuiz />
    </RequireAuth>
  );
}

function NewQuiz() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (dto: CreateQuizDto) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const quiz = await createQuiz(dto);
      await mutate(api.quizzes);
      toast.success("Quiz created");
      router.push(routes.editQuiz(quiz.id));
    } catch (err) {
      setFormError((err as ApiError)?.message ?? "Could not create quiz");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">New quiz</h1>
      <QuizForm
        submitting={submitting}
        submitLabel="Create quiz"
        formError={formError}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
