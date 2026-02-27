import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="inline-flex items-center rounded-full bg-[var(--glass-input)] border border-[var(--glass-border-subtle)] p-0.5">
      <button
        onClick={() => theme === "dark" && toggleTheme()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          theme === "light"
            ? "bg-foreground text-background shadow-sh-1"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Ativar modo claro"
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        onClick={() => theme === "light" && toggleTheme()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
          theme === "dark"
            ? "bg-foreground text-background shadow-sh-1"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Ativar modo escuro"
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
    </div>
  );
}
