import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Kanban, Megaphone, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useIsAdmin } from "@/hooks/useUserRole";

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "CRM", href: "/crm", icon: Kanban },
  { name: "Campanhas", href: "/campaigns", icon: Megaphone },
];

const moreNavItems = [
  { name: "Relatórios", href: "/reports" },
  { name: "Produtos", href: "/products" },
  { name: "Financeiro", href: "/financial" },
  { name: "Integrações", href: "/integrations" },
  { name: "Configurações", href: "/settings" },
];

const adminNavItems = [
  { name: "Usuários", href: "/admin/users" },
];

export function BottomNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = useIsAdmin();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="glass-high mx-3 mb-2 rounded-2xl">
        <div className="flex items-center justify-around px-2 py-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 touch-target",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    active && "bg-primary/15 shadow-glow-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">{item.name}</span>
              </Link>
            );
          })}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 touch-target",
                  isOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("p-2 rounded-xl transition-all duration-200", isOpen && "bg-primary/15")}>
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium mt-0.5">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="glass rounded-t-3xl pb-safe-bottom">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de navegação</SheetTitle>
              </SheetHeader>
              <div className="pt-2 pb-4">
                <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-6" />
                
                <div className="grid grid-cols-3 gap-2">
                  {moreNavItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 touch-target",
                        isActive(item.href)
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "bg-[var(--glass-input)] text-foreground hover:bg-[var(--glass-input)]"
                      )}
                    >
                      <span className="text-sm font-medium text-center">{item.name}</span>
                    </Link>
                  ))}
                </div>

                {isAdmin && (
                  <>
                    <div className="mt-6 mb-3 px-2">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                        Administração
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {adminNavItems.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 touch-target",
                            isActive(item.href)
                              ? "bg-primary/15 text-primary border border-primary/20"
                              : "bg-[var(--glass-input)] text-foreground hover:bg-[var(--glass-input)]"
                          )}
                        >
                          <span className="text-sm font-medium text-center">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
