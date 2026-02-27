import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    container: "py-6",
    icon: "h-10 w-10",
    iconWrapper: "h-16 w-16",
    title: "text-base",
    description: "text-sm",
  },
  md: {
    container: "py-10",
    icon: "h-12 w-12",
    iconWrapper: "h-20 w-20",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-16 w-16",
    iconWrapper: "h-28 w-28",
    title: "text-xl",
    description: "text-base",
  },
};

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      {/* Icon Container */}
      <div
        className={cn(
          "rounded-full bg-muted/50 flex items-center justify-center mb-4",
          sizes.iconWrapper
        )}
      >
        <Icon className={cn("text-muted-foreground/60", sizes.icon)} />
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-sm mb-4",
            sizes.description
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} size="sm">
              {primaryAction.icon && (
                <primaryAction.icon className="h-4 w-4 mr-2" />
              )}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size="sm"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
