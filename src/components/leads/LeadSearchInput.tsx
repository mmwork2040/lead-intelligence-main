import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLeadSearch, type LeadSuggestion } from "@/hooks/useLeadSearch";

interface LeadSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const LeadSearchInput = ({ value, onChange, className }: LeadSearchInputProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isLoading } = useLeadSearch(inputValue);

  // Sincronizar valor externo
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    setOpen(newValue.length >= 2);
  };

  const handleSelectLead = (lead: LeadSuggestion) => {
    setOpen(false);
    navigate(`/leads/${lead.lead_id}`);
  };

  const handleSearchAll = () => {
    setOpen(false);
    onChange(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !open) {
      onChange(inputValue);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Command className="bg-transparent overflow-visible" shouldFilter={false}>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
          <CommandInput
            placeholder="Buscar por nome, email ou telefone..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length >= 2 && setOpen(true)}
            className="border-0 focus:ring-0 h-10 bg-transparent"
          />
        </div>

        {open && inputValue.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <CommandList className="bg-popover border rounded-lg shadow-lg max-h-[300px]">
              {!suggestions || suggestions.length === 0 ? (
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum lead encontrado
                </CommandEmpty>
              ) : (
                <CommandGroup heading="Sugestões">
                  {suggestions.map((lead) => (
                    <CommandItem
                      key={lead.lead_id}
                      value={lead.lead_id}
                      onSelect={() => handleSelectLead(lead)}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2 text-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {lead.name || "Sem nome"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {[lead.email, formatPhone(lead.phone)]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandGroup>
                <CommandItem
                  onSelect={handleSearchAll}
                  className="cursor-pointer border-t"
                >
                  <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>Buscar todos por "{inputValue}"</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
};
