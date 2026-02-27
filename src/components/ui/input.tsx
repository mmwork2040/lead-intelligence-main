import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-[42px] w-full rounded-full bg-[var(--glass-input)] border border-[var(--glass-border-subtle)] px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "focus-visible:border-acid/80 focus-visible:bg-[var(--glass-high)] focus-visible:ring-1 focus-visible:ring-acid/40 focus-visible:shadow-glow-acid hover:border-foreground/15 dark:hover:border-acid/30",
        error: "border-destructive focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.3)] text-destructive",
        success: "border-success focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,0.3)]",
        glow: "focus-visible:border-acid focus-visible:shadow-glow-acid",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        aria-invalid={variant === "error" ? "true" : undefined}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input, inputVariants };
