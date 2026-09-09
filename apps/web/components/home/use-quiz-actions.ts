import { useState } from "react";
import { toast } from "sonner";

import type { ApiError } from "@/lib/api";
import { deleteQuiz, publishQuiz } from "@/lib/quizzes";

export function useQuizActions(quizId: string, mutate: () => Promise<unknown>) {
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onPublish = async () => {
    setPublishing(true);
    try {
      await publishQuiz(quizId);
      toast.success("Quiz published");
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e?.status === 409
          ? "Quiz is already published"
          : (e?.message ?? "Publish failed"),
      );
    } finally {
      setPublishing(false);
      await mutate();
    }
  };

  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Delete failed");
    } finally {
      setDeleting(false);
      await mutate();
    }
  };

  return { publishing, deleting, onPublish, onDelete };
}
