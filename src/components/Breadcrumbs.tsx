import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

// Route to breadcrumb name mapping
const routeNames: Record<string, string> = {
  "dashboard": "Dashboard",
  "leads": "Leads",
  "campaigns": "Campanhas",
  "surveys": "Pesquisas",
  "crm": "CRM",
  "products": "Produtos",
  "financial": "Financeiro",
  "reports": "Relatórios",
  "integrations": "Integrações",
  "settings": "Configurações",
  "admin": "Administração",
  "users": "Usuários",
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);
  
  // Don't show breadcrumbs on dashboard or if no segments
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === "dashboard")) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/");
    const isLast = index === pathSegments.length - 1;
    
    // Check if segment is a UUID (for dynamic routes like /leads/:id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
    const displayName = isUUID ? "Detalhes" : (routeNames[segment] || segment);

    return { path, displayName, isLast, segment };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only md:not-sr-only">Início</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbItems.map((item, index) => (
          <div key={item.path} className="flex items-center gap-1.5">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.displayName}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.displayName}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
