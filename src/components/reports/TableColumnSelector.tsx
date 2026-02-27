import { useState } from "react";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface TableColumnSelectorProps {
  selectedColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

const availableColumns = [
  { id: "impressions", label: "Impressões" },
  { id: "reach", label: "Alcance" },
  { id: "clicks", label: "Cliques" },
  { id: "spend", label: "Gasto" },
  { id: "cpm", label: "CPM" },
  { id: "cpc", label: "CPC" },
  { id: "ctr", label: "CTR" },
  { id: "frequency", label: "Frequência" },
  { id: "conversions", label: "Conversões" },
  { id: "costPerConversion", label: "Custo/Conv" },
  { id: "roas", label: "ROAS" },
];

export function TableColumnSelector({
  selectedColumns,
  onColumnsChange,
}: TableColumnSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      if (selectedColumns.length > 1) {
        onColumnsChange(selectedColumns.filter((id) => id !== columnId));
      }
    } else {
      onColumnsChange([...selectedColumns, columnId]);
    }
  };

  const handleSelectAll = () => {
    onColumnsChange(availableColumns.map((c) => c.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          <span className="hidden md:inline">Colunas</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
            {selectedColumns.length}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Colunas da Tabela</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSelectAll}
            >
              Todas
            </Button>
          </div>

          <Separator />

          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {availableColumns.map((column) => (
              <div
                key={column.id}
                className="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  id={`col-${column.id}`}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={() => handleToggle(column.id)}
                />
                <Label
                  htmlFor={`col-${column.id}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
