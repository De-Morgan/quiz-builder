import type { ReactNode } from "react";

import { cn } from "cn";

type ShellProps = {
  htmlFor: string;
  letter: string;
  text: string;
  checked: boolean;
  control: ReactNode;
};

export function AnswerOptionShell({
  htmlFor,
  letter,
  text,
  checked,
  control,
}: ShellProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3.5 text-sm transition-colors hover:bg-muted/50",
        checked && "border-primary bg-primary/5",
      )}
    >
      {control}
      <span>
        {letter}) {text}
      </span>
    </label>
  );
}

export function optionLetter(index: number) {
  return String.fromCharCode(65 + index);
}
