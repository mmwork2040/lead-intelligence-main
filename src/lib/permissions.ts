import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["app_role"];

// Rotas permitidas por role
const routesByRole: Record<UserRole, string[]> = {
  admin: [
    "/dashboard", "/leads", "/crm", "/products-campaigns", "/funnels",
    "/financial", "/traffic-reports",
    "/link-tracking", "/settings",
    "/admin/users", "/surveys",
  ],
  commercial: [
    "/dashboard", "/leads", "/crm", "/products-campaigns", "/funnels",
    "/traffic-reports", "/surveys",
  ],
  financial: [
    "/dashboard", "/leads", "/financial",
  ],
  support: [
    "/dashboard", "/leads", "/crm",
  ],
};

// Navigation groups visíveis por role
export const navGroupsByRole: Record<UserRole, string[]> = {
  admin: ["Principal", "Análises", "Ferramentas", "Administração"],
  commercial: ["Principal", "Análises"],
  financial: ["Principal", "Análises"],
  support: ["Principal"],
};

// Items específicos de Análises por role
export const analysisItemsByRole: Record<UserRole, string[]> = {
  admin: ["Relatório de Tráfego", "Financeiro"],
  commercial: ["Relatório de Tráfego"],
  financial: ["Financeiro"],
  support: [],
};

export const toolItemsByRole: Record<UserRole, string[]> = {
  admin: ["Criador de Links e Traqueamento"],
  commercial: ["Criador de Links e Traqueamento"],
  financial: [],
  support: [],
};

export function canAccessRoute(role: UserRole | null, path: string): boolean {
  if (!role) return false;
  const routes = routesByRole[role];
  // Check exact match or if path starts with a permitted route (for /leads/:id etc.)
  return routes.some(r => path === r || path.startsWith(r + "/"));
}
