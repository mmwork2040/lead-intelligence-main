import { LayoutDashboard, Table2, LayoutGrid } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ViewMode } from "@/hooks/useUserDashboardPreferences";

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const modes = [
  { value: "dashboard" as ViewMode, icon: LayoutDashboard, label: "Dashboard" },
  { value: "cards" as ViewMode, icon: LayoutGrid, label: "Cards" },
  { value: "table" as ViewMode, icon: Table2, label: "Tabela" },
];

export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ViewMode)}
        className="bg-muted/50 p-1 rounded-lg"
      >
        {modes.map((mode) => (
          <Tooltip key={mode.value}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={mode.value}
                aria-label={mode.label}
                className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3"
              >
                <mode.icon className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{mode.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
    </TooltipProvider>
  );
}
