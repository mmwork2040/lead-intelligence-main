import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "glass shadow-md hover:shadow-glow-acid hover:-translate-y-0.5 hover:ring-1 hover:ring-acid/50 transition-all duration-300",
        destructive: "bg-destructive text-destructive-foreground shadow-sh-1 hover:shadow-sh-2 hover:opacity-90 hover:-translate-y-px",
        outline: "glass border border-[var(--glass-border-subtle)] hover:shadow-sh-2 hover:-translate-y-px text-foreground",
        secondary: "glass-high shadow-sh-1 text-foreground hover:shadow-sh-2 hover:-translate-y-px",
        ghost: "hover:bg-[var(--glass-input)] text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-[hsl(160,55%,40%)] text-white dark:bg-[#CCFF00] dark:text-stone-900 shadow-sh-1 hover:shadow-sh-2 hover:opacity-90 hover:-translate-y-px",
        warning: "bg-[hsl(38,92%,50%)] text-white shadow-sh-1 hover:shadow-sh-2 hover:opacity-90 hover:-translate-y-px",
        blue: "bg-primary text-primary-foreground shadow-sh-1 hover:shadow-glow-primary hover:opacity-90 hover:-translate-y-px",
      },
      size: {
        default: "h-[42px] px-5 py-2",
        sm: "h-9 px-4",
        lg: "h-[50px] px-8",
        icon: "h-[42px] w-[42px]",
        xs: "h-[30px] px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
