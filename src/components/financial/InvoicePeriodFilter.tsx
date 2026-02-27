import { useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InvoicePeriodFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
}

type QuickFilter = "prev-month" | "current-month" | "last-30" | "custom";

export function InvoicePeriodFilter({
  startDate,
  endDate,
  onDateChange,
}: InvoicePeriodFilterProps) {
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>("prev-month");
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleQuickFilter = (filter: QuickFilter) => {
    setActiveQuickFilter(filter);
    const now = new Date();

    switch (filter) {
      case "prev-month":
        onDateChange(
          startOfMonth(subMonths(now, 1)),
          endOfMonth(subMonths(now, 1))
        );
        break;
      case "current-month":
        onDateChange(startOfMonth(now), endOfMonth(now));
        break;
      case "last-30":
        onDateChange(subDays(now, 30), now);
        break;
      case "custom":
        // Keep current dates, just switch to custom mode
        break;
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setActiveQuickFilter("custom");
    onDateChange(date || null, endDate);
    setIsStartOpen(false);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setActiveQuickFilter("custom");
    onDateChange(startDate, date || null);
    setIsEndOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Selecione o período";
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    }
    if (startDate) return `A partir de ${format(startDate, "dd/MM/yyyy")}`;
    if (endDate) return `Até ${format(endDate, "dd/MM/yyyy")}`;
    return "Selecione o período";
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quick filter buttons */}
      <div className="flex gap-1">
        <Button
          variant={activeQuickFilter === "prev-month" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("prev-month")}
        >
          Mês Anterior
        </Button>
        <Button
          variant={activeQuickFilter === "current-month" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("current-month")}
        >
          Mês Atual
        </Button>
        <Button
          variant={activeQuickFilter === "last-30" ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickFilter("last-30")}
        >
          Últimos 30 dias
        </Button>
      </div>

      {/* Custom date pickers */}
      <div className="flex items-center gap-2">
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate || undefined}
              onSelect={handleStartDateChange}
              initialFocus
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">até</span>

        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[130px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate || undefined}
              onSelect={handleEndDateChange}
              initialFocus
              locale={ptBR}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Display selected range */}
      <span className="text-sm text-muted-foreground hidden lg:inline">
        {formatDateRange()}
      </span>
    </div>
  );
}
