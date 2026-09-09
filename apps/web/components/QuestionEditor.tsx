"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import type { QuizFormActions } from "@/app/quizzes/_hooks/useQuizForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QuestionInput, QuestionType } from "@/lib/types";

const MIN_ANSWERS = 2;
const MAX_ANSWERS = 5;

type Props = {
  question: QuestionInput;
  index: number;
  actions: QuizFormActions;
  errors: string[];
  canRemove: boolean;
};

export function QuestionEditor({
  question,
  index,
  actions,
  errors,
  canRemove,
}: Props) {
  const { answers, type } = question;
  const correctIndex = answers.findIndex((a) => a.isCorrect);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question {index + 1}</CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canRemove}
            onClick={() => actions.removeQuestion(index)}
          >
            <Trash2Icon /> Remove
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`q-${index}-text`}>Question text</Label>
          <Input
            id={`q-${index}-text`}
            value={question.text}
            onChange={(e) => actions.setQuestionText(index, e.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={`q-${index}-type`}>Type</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              actions.setQuestionType(index, v as QuestionType)
            }
          >
            <SelectTrigger id={`q-${index}-type`} className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE">Single answer</SelectItem>
              <SelectItem value="MULTIPLE">Multiple answers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            Answers ({MIN_ANSWERS}–{MAX_ANSWERS}) — mark the correct{" "}
            {type === "SINGLE" ? "one" : "ones"}
          </legend>

          {type === "SINGLE" ? (
            <RadioGroup
              value={correctIndex >= 0 ? String(correctIndex) : undefined}
              onValueChange={(v) =>
                actions.setAnswerCorrect(index, Number(v), true)
              }
              className="gap-2"
            >
              {answers.map((answer, aIndex) => (
                <AnswerRow
                  key={aIndex}
                  qIndex={index}
                  aIndex={aIndex}
                  text={answer.text}
                  actions={actions}
                  canRemove={answers.length > MIN_ANSWERS}
                  control={
                    <RadioGroupItem
                      value={String(aIndex)}
                      aria-label={`Answer ${aIndex + 1} is correct`}
                    />
                  }
                />
              ))}
            </RadioGroup>
          ) : (
            answers.map((answer, aIndex) => (
              <AnswerRow
                key={aIndex}
                qIndex={index}
                aIndex={aIndex}
                text={answer.text}
                actions={actions}
                canRemove={answers.length > MIN_ANSWERS}
                control={
                  <Checkbox
                    checked={answer.isCorrect}
                    onCheckedChange={(c) =>
                      actions.setAnswerCorrect(index, aIndex, c === true)
                    }
                    aria-label={`Answer ${aIndex + 1} is correct`}
                  />
                }
              />
            ))
          )}

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={answers.length >= MAX_ANSWERS}
              onClick={() => actions.addAnswer(index)}
            >
              <PlusIcon /> Add answer
            </Button>
          </div>
        </fieldset>

        {errors.length > 0 ? (
          <ul className="grid gap-1">
            {errors.map((e) => (
              <li key={e} className="text-destructive text-sm">
                {e}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AnswerRow({
  qIndex,
  aIndex,
  text,
  actions,
  canRemove,
  control,
}: {
  qIndex: number;
  aIndex: number;
  text: string;
  actions: QuizFormActions;
  canRemove: boolean;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {control}
      <Input
        value={text}
        placeholder={`Answer ${aIndex + 1}`}
        onChange={(e) => actions.setAnswerText(qIndex, aIndex, e.target.value)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove}
        onClick={() => actions.removeAnswer(qIndex, aIndex)}
        aria-label={`Remove answer ${aIndex + 1}`}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
