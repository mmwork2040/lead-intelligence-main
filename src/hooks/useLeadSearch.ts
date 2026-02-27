import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface LeadSuggestion {
  lead_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export const useLeadSearch = (searchTerm: string) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce de 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery({
    queryKey: ["lead-search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) {
        return [];
      }

      const searchPattern = `%${debouncedTerm}%`;

      const { data, error } = await supabase
        .from("leads")
        .select("lead_id, name, email, phone")
        .or(`name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;

      return data as LeadSuggestion[];
    },
    enabled: debouncedTerm.length >= 2,
    staleTime: 30000, // Cache por 30 segundos
  });
};
