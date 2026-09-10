import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicQuestion } from "@/lib/types";

import { AnswerOptionShell, optionLetter } from "./answer-option";

type Props = {
  question: PublicQuestion;
  index: number;
  selected: Set<string>;
  onToggle: (answerId: string, checked: boolean) => void;
};

export function TakeQuestion({ question, index, selected, onToggle }: Props) {
  const { text, type, answers } = question;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">
        {index + 1}. {text}
      </h2>
      {type === "SINGLE" ? (
        <SingleAnswers answers={answers} selected={selected} onToggle={onToggle} />
      ) : (
        <MultipleAnswers
          answers={answers}
          selected={selected}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

type AnswersProps = {
  answers: PublicQuestion["answers"];
  selected: Set<string>;
  onToggle: (answerId: string, checked: boolean) => void;
};

function SingleAnswers({ answers, selected, onToggle }: AnswersProps) {
  return (
    <RadioGroup
      value={[...selected][0] ?? ""}
      onValueChange={(value) => onToggle(value, true)}
      className="gap-3"
    >
      {answers.map((answer, i) => (
        <AnswerOptionShell
          key={answer.id}
          htmlFor={answer.id}
          letter={optionLetter(i)}
          text={answer.text}
          checked={selected.has(answer.id)}
          control={<RadioGroupItem id={answer.id} value={answer.id} />}
        />
      ))}
    </RadioGroup>
  );
}

function MultipleAnswers({ answers, selected, onToggle }: AnswersProps) {
  return (
    <div className="grid gap-3">
      {answers.map((answer, i) => (
        <AnswerOptionShell
          key={answer.id}
          htmlFor={answer.id}
          letter={optionLetter(i)}
          text={answer.text}
          checked={selected.has(answer.id)}
          control={
            <Checkbox
              id={answer.id}
              checked={selected.has(answer.id)}
              onCheckedChange={(c) => onToggle(answer.id, c === true)}
            />
          }
        />
      ))}
    </div>
  );
}
