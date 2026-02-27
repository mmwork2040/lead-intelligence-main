import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input, type InputProps } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
  success?: string;
  description?: string;
  required?: boolean;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, success, description, required, className, id, ...props }, ref) => {
    const fieldId = id || React.useId();
    const descriptionId = `${fieldId}-description`;
    const errorId = `${fieldId}-error`;

    const variant = error ? "error" : success ? "success" : "default";

    return (
      <div className="space-y-2">
        <Label 
          htmlFor={fieldId} 
          className={cn(
            "text-[13px] font-medium",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-0.5" aria-hidden="true">*</span>}
        </Label>
        
        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            variant={variant}
            className={cn(
              (error || success) && "pr-10",
              className
            )}
            aria-describedby={cn(
              description && descriptionId,
              error && errorId
            )}
            aria-required={required}
            {...props}
          />
          
          {error && (
            <AlertCircle 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" 
              aria-hidden="true"
            />
          )}
          {success && !error && (
            <CheckCircle2 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" 
              aria-hidden="true"
            />
          )}
        </div>

        {description && !error && (
          <p id={descriptionId} className="text-[12px] text-muted-foreground">
            {description}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-[12px] text-destructive flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
        
        {success && !error && (
          <p className="text-[12px] text-primary flex items-center gap-1">
            {success}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
