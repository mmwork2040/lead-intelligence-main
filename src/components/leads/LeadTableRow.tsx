import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Phone, GitMerge, Trash2 } from "lucide-react";
import { getSourceLabel } from "@/lib/translations";
import { getWhatsAppUrl } from "@/lib/utils";
import type { LeadWithProducts } from "@/hooks/useLeads";

interface LeadTableRowProps {
  lead: LeadWithProducts;
  isSelected: boolean;
  onSelect: (leadId: string) => void;
  onUnify: (leadId: string) => void;
  onDelete: (lead: LeadWithProducts) => void;
  productColors?: Record<string, string>;
  campaignColors?: Record<string, string>;
}

export function LeadTableRow({ lead, isSelected, onSelect, onUnify, onDelete, productColors = {}, campaignColors = {} }: LeadTableRowProps) {
  const navigate = useNavigate();
  const isVIP = (lead.totalValue || 0) >= 1000;
  const isBuyer = (lead.totalPurchases || 0) > 0;
  const whatsAppUrl = getWhatsAppUrl(lead.phone);

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => navigate(`/leads/${lead.lead_id}`)}
    >
      {/* Checkbox */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(lead.lead_id)}
        />
      </TableCell>

      {/* Lead (Name + Email stacked) */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{lead.name || "Sem nome"}</span>
            {isVIP && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs px-1">
                VIP
              </Badge>
            )}
            {isBuyer && (
              <Badge className="bg-violet-500 text-white dark:bg-[#CCFF00] dark:text-black border-none text-xs px-1 shadow-sh-1 hover:shadow-glow-acid hover:-translate-y-0.5 transition-all">
                Comprador
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {lead.email || "-"}
          </span>
        </div>
      </TableCell>

      {/* Phone (clickable) */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        {whatsAppUrl ? (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </a>
        ) : lead.phone ? (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            {lead.phone}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Product + Value */}
      <TableCell>
        <div className="flex flex-col gap-1">
          {lead.products && lead.products.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {(() => {
                const firstProduct = lead.products[0];
                const pColor = firstProduct.slug ? productColors[firstProduct.slug] : undefined;
                return (
                  <Badge
                    variant="secondary"
                    className={!pColor ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)] text-xs" : "text-xs border"}
                    style={pColor ? { backgroundColor: `${pColor}1A`, color: pColor, borderColor: `${pColor}33` } : undefined}
                  >
                    {firstProduct.name}
                  </Badge>
                );
              })()}
              {lead.products.length > 1 && (
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  +{lead.products.length - 1}
                </Badge>
              )}
            </div>
          ) : null}
          {(lead.totalValue || 0) > 0 && (
            <span className="text-sm font-semibold text-[hsl(160,55%,40%)] dark:text-[#CCFF00]">
              R$ {lead.totalValue?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </TableCell>

      {/* Campaign + Date */}
      <TableCell>
        <div className="flex flex-col gap-1">
          {lead.project_slug ? (
            <Badge
              variant="outline"
              className={!campaignColors[lead.project_slug] ? "bg-primary/10 text-primary border-primary/20 text-xs w-fit" : "text-xs w-fit border"}
              style={campaignColors[lead.project_slug] ? {
                backgroundColor: `${campaignColors[lead.project_slug]}1A`,
                color: campaignColors[lead.project_slug],
                borderColor: `${campaignColors[lead.project_slug]}33`
              } : undefined}
            >
              {lead.project_slug}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
          <span className="text-xs text-muted-foreground">
            {lead.created_at
              ? new Date(lead.created_at).toLocaleDateString("pt-BR")
              : "-"}
          </span>
        </div>
      </TableCell>

      {/* Source */}
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {getSourceLabel(lead.source || "") || "Desconhecida"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:text-primary h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onUnify(lead.lead_id);
            }}
          >
            <GitMerge className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
