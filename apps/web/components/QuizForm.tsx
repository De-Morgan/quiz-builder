"use client";

import { PlusIcon } from "lucide-react";
import { useMemo } from "react";

import {
  useQuizForm,
  type QuizFormState,
} from "@/app/quizzes/_hooks/useQuizForm";
import { QuestionEditor } from "@/components/QuestionEditor";
import { Spinner } from "@/components/Spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/Field";
import type { CreateQuizDto } from "@/lib/types";
import { validateQuestion, validateQuiz } from "@/lib/validation";

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;

type Props = {
  initial?: QuizFormState;
  submitting?: boolean;
  submitLabel?: string;
  /** Server-side error to surface above the submit button. */
  formError?: string | null;
  onSubmit: (dto: CreateQuizDto) => void;
};

export function QuizForm({
  initial,
  submitting = false,
  submitLabel = "Save quiz",
  formError,
  onSubmit,
}: Props) {
  const { state, actions } = useQuizForm(initial);

  const allErrors = useMemo(() => validateQuiz(state), [state]);
  const questionErrors = useMemo(
    () =>
      state.questions.map((q, i) =>
        validateQuestion(q, `Question ${i + 1}`),
      ),
    [state.questions],
  );
  const isValid = allErrors.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    onSubmit({ title: state.title.trim(), questions: state.questions });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Field
        label="Quiz title"
        value={state.title}
        onChange={(e) => actions.setTitle(e.target.value)}
      />

      <div className="grid gap-4">
        {state.questions.map((question, i) => (
          <QuestionEditor
            key={i}
            question={question}
            index={i}
            actions={actions}
            errors={questionErrors[i] ?? []}
            canRemove={state.questions.length > MIN_QUESTIONS}
          />
        ))}
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={state.questions.length >= MAX_QUESTIONS}
          onClick={actions.addQuestion}
        >
          <PlusIcon /> Add question
        </Button>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {!isValid ? (
        <Alert variant="destructive">
          <AlertTitle>Fix these before saving</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {allErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div>
        <Button type="submit" disabled={!isValid || submitting}>
          {submitting ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
