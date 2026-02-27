import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  UserPlus,
  ShoppingCart,
  ShoppingBag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  MousePointer,
  Activity,
  Clock,
  Merge,
  FileEdit,
  AlertCircle,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import { getEventLabel, getPurchaseStatusLabel, getSourceLabel } from "@/lib/translations";
import type { Database } from "@/integrations/supabase/types";

type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

interface TimelineItem {
  id: string;
  type: "event" | "purchase";
  date: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  details?: React.ReactNode;
  value?: number;
  status?: string;
  source?: string;
}

interface LeadTimelineProps {
  events: LeadEvent[];
  purchases: Purchase[];
  maxItems?: number;
}

// Blue: leads / new opportunities
const B = { bg: "bg-[rgba(59,130,246,0.12)] dark:bg-[rgba(59,130,246,0.10)]", color: "text-[hsl(217,91%,55%)] dark:text-[hsl(217,91%,70%)]" };
// Green/Acid: money / purchases / success
const G = { bg: "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)]", color: "text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" };
// Amber: transitions / status changes
const A = { bg: "bg-[rgba(245,158,11,0.10)] dark:bg-[rgba(245,158,11,0.08)]", color: "text-[hsl(38,92%,45%)] dark:text-[hsl(45,100%,55%)]" };
// Red: negative events
const R = { bg: "bg-destructive/10", color: "text-destructive" };
// Neutral: informational
const N = { bg: "bg-muted", color: "text-muted-foreground" };

const getEventConfig = (eventType: string): { icon: React.ElementType; bg: string; color: string } => {
  switch (eventType) {
    case "lead_created":
    case "new_lead":
      return { icon: UserPlus, ...B };
    case "lead_updated":
      return { icon: FileEdit, ...B };
    case "lead_merged":
      return { icon: Merge, ...A };
    case "lead_imported":
      return { icon: UserPlus, ...B };
    case "status_changed":
      return { icon: RefreshCw, ...A };
    case "email_opened":
      return { icon: Mail, ...B };
    case "link_clicked":
      return { icon: MousePointer, ...A };
    case "cart_added":
      return { icon: ShoppingCart, ...A };
    case "cart_abandoned":
      return { icon: ShoppingCart, ...R };
    case "purchase_created":
    case "purchase":
    case "sale":
      return { icon: ShoppingBag, ...G };
    case "purchase_completed":
    case "PURCHASE_COMPLETE":
    case "PURCHASE_APPROVED":
      return { icon: CheckCircle, ...G };
    case "purchase_updated":
      return { icon: FileEdit, ...A };
    case "purchase_deleted":
    case "PURCHASE_CANCELED":
    case "PURCHASE_REFUNDED":
      return { icon: XCircle, ...R };
    case "PURCHASE_CHARGEBACK":
      return { icon: RotateCcw, ...R };
    case "PURCHASE_BILLET_PRINTED":
      return { icon: CreditCard, ...A };
    case "contact":
    case "contacted":
      return { icon: User, ...N };
    default:
      return { icon: Activity, ...N };
  }
};

const getPurchaseStatusConfig = (status: string): { icon: React.ElementType; bg: string; color: string } => {
  switch (status) {
    case "approved":
      return { icon: CheckCircle, ...G };
    case "pending":
      return { icon: Clock, ...A };
    case "declined":
    case "cancelled":
      return { icon: XCircle, ...R };
    case "refunded":
      return { icon: RotateCcw, ...A };
    case "chargeback":
      return { icon: AlertCircle, ...R };
    default:
      return { icon: ShoppingBag, ...N };
  }
};

export function LeadTimeline({ events, purchases, maxItems }: LeadTimelineProps) {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add events
    events.forEach((event) => {
      const config = getEventConfig(event.event_type);
      const eventData = event.event_data as Record<string, any> | null;
      
      let subtitle: string | undefined;
      let details: React.ReactNode | undefined;

      // Build subtitle and details based on event type
      if (event.event_type === "status_changed" && eventData) {
        subtitle = `${eventData.old_status || "novo"} → ${eventData.new_status || "atualizado"}`;
      } else if (event.event_type === "purchase_created" && eventData) {
        subtitle = eventData.product_name;
        if (eventData.value) {
          details = (
            <span className="text-[hsl(160,55%,40%)] dark:text-[#CCFF00] font-medium">
              R$ {Number(eventData.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          );
        }
      } else if (event.event_type === "lead_merged" && eventData) {
        subtitle = `Lead unificado: ${eventData.merged_lead_id?.slice(0, 8)}...`;
      } else if (eventData?.product_name) {
        subtitle = eventData.product_name;
      }

      items.push({
        id: event.id,
        type: "event",
        date: event.created_at || "",
        icon: config.icon,
        iconBg: config.bg,
        iconColor: config.color,
        title: getEventLabel(event.event_type),
        subtitle,
        details,
        source: event.source || undefined,
      });
    });

    // Add purchases as timeline items
    purchases.forEach((purchase) => {
      const config = getPurchaseStatusConfig(purchase.status);
      
      items.push({
        id: purchase.id,
        type: "purchase",
        date: purchase.purchase_date || purchase.created_at || "",
        icon: config.icon,
        iconBg: config.bg,
        iconColor: config.color,
        title: `Compra: ${purchase.product_name}`,
        subtitle: getPurchaseStatusLabel(purchase.status),
        value: purchase.value || undefined,
        status: purchase.status,
        source: purchase.source || purchase.platform || undefined,
        details: (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {purchase.value && (
              <span className={`font-medium ${purchase.status === "approved" ? "text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" : "text-muted-foreground"}`}>
                R$ {purchase.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            )}
            {purchase.payment_method && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {purchase.payment_method === "credit_card" ? "Cartão" : 
                 purchase.payment_method === "pix" ? "PIX" : 
                 purchase.payment_method === "boleto" ? "Boleto" : purchase.payment_method}
              </Badge>
            )}
            {purchase.installments && purchase.installments > 1 && (
              <span className="text-muted-foreground">{purchase.installments}x</span>
            )}
          </div>
        ),
      });
    });

    // Sort by date (most recent first)
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limit items if maxItems is specified
    return maxItems ? items.slice(0, maxItems) : items;
  }, [events, purchases, maxItems]);

  // Group items by date (must be before any conditional return to respect Rules of Hooks)
  const groupedItems = useMemo(() => {
    if (timelineItems.length === 0) return [];

    const groups: Record<string, TimelineItem[]> = {};
    
    timelineItems.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      label: format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      items,
    }));
  }, [timelineItems]);

  if (timelineItems.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Nenhuma atividade registrada ainda</p>
        <p className="text-xs text-muted-foreground mt-1">
          Eventos, compras e interações aparecerão aqui
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((group) => (
        <div key={group.date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground px-2">
              {group.label}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Timeline Items */}
          <div className="space-y-3">
            {group.items.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === group.items.length - 1;

              return (
                <div key={item.id} className="flex gap-3">
                  {/* Icon + Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    {!isLast && <div className="flex-1 w-px bg-border mt-2" />}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                        {item.details && (
                          <div className="mt-1">{item.details}</div>
                        )}
                        {item.source && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <span>📍</span> {getSourceLabel(item.source)}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.date), "HH:mm", { locale: ptBR })}
                        </p>
                        {item.type === "purchase" && (
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] px-1.5 py-0 mt-1 ${
                              item.status === "approved" 
                                ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]" 
                                : item.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }`}
                          >
                            {item.status === "approved" ? "Aprovada" : 
                             item.status === "pending" ? "Pendente" : 
                             getPurchaseStatusLabel(item.status || "")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
