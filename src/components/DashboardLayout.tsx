import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSyncFacebookAds } from "@/hooks/useAutoSyncFacebookAds";
import { useIsAdmin, useUserRole } from "@/hooks/useUserRole";
import { navGroupsByRole, analysisItemsByRole, toolItemsByRole } from "@/lib/permissions";
import {
  LayoutDashboard, Users, Target, Package, DollarSign, Briefcase, Settings,
  BarChart3, Webhook, LogOut, Workflow,
  ChevronDown, ChevronRight, Search,
} from "lucide-react";
import { AIAssistant } from "./ai/AIAssistant";
import { Breadcrumbs } from "./Breadcrumbs";
import { BottomNav } from "./BottomNav";
import { DemoBanner } from "./demo/DemoBanner";
import { DemoTooltips } from "./demo/DemoTooltips";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigationGroups = [
  {
    name: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Leads", href: "/leads", icon: Users },
      { name: "CRM", href: "/crm", icon: Briefcase },
      { name: "Produtos e Campanhas", href: "/products-campaigns", icon: Target },
      { name: "Funis", href: "/funnels", icon: Workflow },
    ],
  },
  {
    name: "Análises",
    items: [
      { name: "Relatório de Tráfego", href: "/traffic-reports", icon: BarChart3 },
      { name: "Financeiro", href: "/financial", icon: DollarSign },
    ],
  },
  {
    name: "Ferramentas",
    items: [
      { name: "Criador de Links e Traqueamento", href: "/link-tracking", icon: Webhook },
    ],
  },
];

const adminNavigation = [
  { name: "Configurações", href: "/settings", icon: Settings },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { data: userRole } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Principal": true, "Marketing": true, "Análises": true,
    "Ferramentas": true, "Administração": true,
  });

  // Filter navigation groups by user role
  const roleFilteredNavGroups = useMemo(() => {
    if (!userRole) return [];
    const allowedGroups = navGroupsByRole[userRole] || [];
    const allowedAnalysis = analysisItemsByRole[userRole] || [];
    const allowedTools = toolItemsByRole[userRole] || [];

    return navigationGroups
      .filter(g => allowedGroups.includes(g.name))
      .map(g => {
        if (g.name === "Análises") {
          return { ...g, items: g.items.filter(i => allowedAnalysis.includes(i.name)) };
        }
        if (g.name === "Ferramentas") {
          return { ...g, items: g.items.filter(i => allowedTools.includes(i.name)) };
        }
        return g;
      })
      .filter(g => g.items.length > 0);
  }, [userRole]);

  // Filter navigation items based on search query
  const filteredNavGroups = searchQuery.trim()
    ? roleFilteredNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((group) => group.items.length > 0)
    : roleFilteredNavGroups;

  const filteredAdminNav = searchQuery.trim()
    ? adminNavigation.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : adminNavigation;

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  useAutoSyncFacebookAds();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getUserDisplay = () => user?.email || "Usuário";
  const getUserInitial = () => user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass-high z-50 flex items-center justify-between px-4 safe-top">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center text-background font-bold text-sm">
            L
          </div>
          <span className="font-semibold text-base text-foreground tracking-tight">Leads Intel</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{getUserInitial()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass rounded-xl">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{getUserDisplay()}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="touch-target rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              {user && (
                <DropdownMenuItem onClick={handleSignOut} className="touch-target rounded-lg">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-64 glass z-50 border-r border-[var(--glass-border)]">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-[var(--glass-border-subtle)]">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center text-background font-bold text-base">
                L
              </div>
              <div>
                <span className="font-semibold text-base block text-foreground tracking-tight">Leads Intel</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Platform</span>
              </div>
            </Link>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-9 h-9 text-[13px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
            {filteredNavGroups.map((group) => (
              <Collapsible
                key={group.name}
                open={openGroups[group.name]}
                onOpenChange={() => toggleGroup(group.name)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] hover:text-foreground transition-colors rounded-lg">
                  <span>{group.name}</span>
                  {openGroups[group.name] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                          isActive
                            ? "glass-high shadow-sh-1 text-primary font-medium border border-primary/20"
                            : "text-muted-foreground hover:bg-[var(--glass-input)] hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[13px] font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}

            {isAdmin && filteredAdminNav.length > 0 && (
              <Collapsible
                open={openGroups["Administração"]}
                onOpenChange={() => toggleGroup("Administração")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em] hover:text-foreground transition-colors rounded-lg">
                  <span>Administração</span>
                  {openGroups["Administração"] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-0.5">
                  {filteredAdminNav.map((item) => {
                    const isActive = location.pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200",
                          isActive
                            ? "glass-high shadow-sh-1 text-primary font-medium border border-primary/20"
                            : "text-muted-foreground hover:bg-[var(--glass-input)] hover:text-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[13px] font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>

          {/* Settings & User */}
          <div className="p-3 border-t border-[var(--glass-border-subtle)] space-y-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--glass-input)]">
              <span className="text-[13px] font-medium text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>

            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-[var(--glass-input)] hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-[13px] font-medium">Configurações</span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-[var(--glass-input)] hover:text-foreground transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">{getUserInitial()}</span>
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-[13px] font-medium truncate text-foreground">{getUserDisplay()}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass rounded-xl">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user && (
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </div>
      </main>

      <BottomNav />
      <AIAssistant context={location.pathname} />
      <DemoBanner />
      <DemoTooltips />
    </div>
  );
};

export default DashboardLayout;
