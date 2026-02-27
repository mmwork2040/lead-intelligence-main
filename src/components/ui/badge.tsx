import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-[var(--glass-border-subtle)] bg-[var(--glass-input)] text-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        outline: "text-foreground border-[var(--glass-border-subtle)]",
        success: "border-transparent bg-[rgba(16,185,129,0.10)] text-[hsl(160,55%,40%)] dark:bg-[rgba(204,255,0,0.08)] dark:text-[#CCFF00]",
        warning: "border-transparent bg-[rgba(245,158,11,0.12)] text-[hsl(38,92%,50%)] dark:bg-[rgba(245,158,11,0.08)] dark:text-[hsl(38,92%,50%)]",
        info: "border-transparent bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
