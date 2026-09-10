import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicQuestion } from "@/lib/types";

type Props = {
  question: PublicQuestion;
  index: number;
  selected: Set<string>;
  onToggle: (answerId: string, checked: boolean) => void;
};

export function TakeQuestion({ question, index, selected, onToggle }: Props) {
  const { id, text, type, answers } = question;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index + 1}. {text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {type === "SINGLE" ? (
          <RadioGroup
            value={[...selected][0] ?? ""}
            onValueChange={(value) => onToggle(value, true)}
            className="gap-2"
          >
            {answers.map((answer) => (
              <div key={answer.id} className="flex items-center gap-2">
                <RadioGroupItem id={answer.id} value={answer.id} />
                <Label htmlFor={answer.id} className="font-normal">
                  {answer.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <div className="grid gap-2">
            {answers.map((answer) => (
              <div key={answer.id} className="flex items-center gap-2">
                <Checkbox
                  id={answer.id}
                  checked={selected.has(answer.id)}
                  onCheckedChange={(c) => onToggle(answer.id, c === true)}
                />
                <Label htmlFor={answer.id} className="font-normal">
                  {answer.text}
                </Label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
