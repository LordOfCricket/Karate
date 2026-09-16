import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMessage?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, errorMessage, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = errorMessage ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-10 rounded-md border bg-surface-raised px-3 text-sm text-text-primary placeholder:text-text-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            errorMessage ? "border-danger" : "border-border",
            className,
          )}
          {...props}
        />
        {hint && !errorMessage && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {errorMessage && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
