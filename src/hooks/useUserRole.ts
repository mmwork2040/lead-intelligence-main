import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["app_role"];

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role as UserRole | null;
    },
    enabled: !!user?.id,
  });
};

export const useIsAdmin = () => {
  const { data: role } = useUserRole();
  return role === "admin";
};

export const useHasAnyRole = () => {
  const { data: role, isLoading } = useUserRole();
  return { hasRole: !!role, role, isLoading };
};
