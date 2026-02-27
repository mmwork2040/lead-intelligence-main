import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Phone, ChevronRight, GitMerge, Trash2 } from "lucide-react";
import { getSourceLabel } from "@/lib/translations";
import { getWhatsAppUrl } from "@/lib/utils";
import type { LeadWithProducts } from "@/hooks/useLeads";

interface LeadCardProps {
  lead: LeadWithProducts;
  isSelected: boolean;
  onSelect: (leadId: string) => void;
  onUnify: (leadId: string) => void;
  onDelete: (lead: LeadWithProducts) => void;
  productColors?: Record<string, string>;
  campaignColors?: Record<string, string>;
}

export function LeadCard({ lead, isSelected, onSelect, onUnify, onDelete, productColors = {}, campaignColors = {} }: LeadCardProps) {
  const navigate = useNavigate();
  const isVIP = (lead.totalValue || 0) >= 1000;
  const isBuyer = (lead.totalPurchases || 0) > 0;
  const whatsAppUrl = getWhatsAppUrl(lead.phone);

  const handleCardClick = () => {
    navigate(`/leads/${lead.lead_id}`);
  };

  return (
    <Card
      className="p-4 hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.99] flashlight-card hover:border-acid/30 relative overflow-hidden group"
      onClick={handleCardClick}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }}
    >
      {/* Row 1: Checkbox + Name + Value/Status */}
      <div className="flex items-start gap-3">
        <div
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(lead.lead_id)}
            className="h-5 w-5"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-base truncate">
              {lead.name || "Sem nome"}
            </span>
            {isVIP && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-1.5">
                VIP
              </Badge>
            )}
            {isBuyer && (
              <Badge className="bg-violet-500 text-white dark:bg-[#CCFF00] dark:text-black border-none text-xs px-1.5 shadow-sh-1 hover:shadow-glow-acid hover:-translate-y-0.5 transition-all">
                Comprador
              </Badge>
            )}
          </div>

          {/* Email */}
          <p className="text-sm text-muted-foreground truncate mb-2">
            {lead.email || "-"}
          </p>

          {/* Phone */}
          {whatsAppUrl ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3.5 w-3.5" />
              {lead.phone}
            </a>
          ) : lead.phone ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <Phone className="h-3.5 w-3.5" />
              {lead.phone}
            </span>
          ) : null}

          {/* Product + Campaign badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {lead.products && lead.products.length > 0 && (() => {
              const firstProduct = lead.products[0];
              const pColor = firstProduct.slug ? productColors[firstProduct.slug] : undefined;
              return (
                <Badge
                  variant="secondary"
                  className={!pColor ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] text-xs" : "text-xs border"}
                  style={pColor ? { backgroundColor: `${pColor}1A`, color: pColor, borderColor: `${pColor}33` } : undefined}
                >
                  {firstProduct.name}
                  {lead.products.length > 1 && ` +${lead.products.length - 1}`}
                </Badge>
              );
            })()}
            {lead.project_slug && (
              <Badge
                variant="outline"
                className={!campaignColors[lead.project_slug] ? "bg-primary/10 text-primary border-primary/20 text-xs" : "text-xs border"}
                style={campaignColors[lead.project_slug] ? {
                  backgroundColor: `${campaignColors[lead.project_slug]}1A`,
                  color: campaignColors[lead.project_slug],
                  borderColor: `${campaignColors[lead.project_slug]}33`
                } : undefined}
              >
                {lead.project_slug}
              </Badge>
            )}
          </div>

          {/* Footer: Date + Source + Value + Actions */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                {lead.created_at
                  ? new Date(lead.created_at).toLocaleDateString("pt-BR")
                  : "-"}
              </span>
              <span>•</span>
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {getSourceLabel(lead.source || "") || "Desconhecida"}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              {(lead.totalValue || 0) > 0 && (
                <span className="font-semibold text-[hsl(160,55%,40%)] dark:text-[#CCFF00] mr-2">
                  R$ {lead.totalValue?.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnify(lead.lead_id);
                }}
              >
                <GitMerge className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
