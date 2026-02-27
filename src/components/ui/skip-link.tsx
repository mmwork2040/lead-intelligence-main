import * as React from "react";
import { cn } from "@/lib/utils";

interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
  children?: React.ReactNode;
}

export function SkipLink({ 
  targetId, 
  children = "Pular para o conteúdo principal",
  className,
  ...props 
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
