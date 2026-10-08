import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  error?: string;
};

export function FormField({
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  error,
}: FormFieldProps) {
  // Next keeps previous routes mounted but hidden, so ids must be unique
  // across the auth forms.
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {/* Announced through aria-describedby when the field gets focus, which
          the form moves to the first invalid field. A live region here would
          read every error twice. */}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
