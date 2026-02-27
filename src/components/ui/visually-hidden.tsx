import * as React from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Component that hides content visually but keeps it accessible to screen readers.
 * Use for labels, announcements, and other text that should be read but not seen.
 */
export function VisuallyHidden({ children, ...props }: VisuallyHiddenProps) {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
}
