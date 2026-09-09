import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  containerClassName?: string;
};

/** Label + Input + an inline error line. */
export function Field({
  label,
  error,
  hint,
  containerClassName,
  className,
  ...inputProps
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={cn("grid gap-1.5", containerClassName)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={className}
        {...inputProps}
      />
      {hint ? (
        <p className="text-muted-foreground text-sm">{hint}</p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
