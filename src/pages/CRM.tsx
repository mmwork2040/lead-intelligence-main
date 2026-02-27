import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { 
  User, 
  Loader2, 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2, 
  Phone,
  MessageCircle
} from "lucide-react";
import { useCRMPipeline, useUpdateLeadStatus, CRM_STATUSES, type CRMStatus, type CRMColumn, type CRMLead } from "@/hooks/useCRMPipeline";
import { useDeleteLead } from "@/hooks/useLeads";
import { useNavigate } from "react-router-dom";
import { ProductFilter } from "@/components/crm/ProductFilter";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter } from "@/lib/dateUtils";
import { cn, normalizePhoneForWhatsApp } from "@/lib/utils";
import { LeadDialog } from "@/components/leads/LeadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const CRM = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<CRMStatus | null>(null);
  
  // Dialog states
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<CRMLead | null>(null);
  
  const { data: pipeline, isLoading } = useCRMPipeline(selectedProduct, period);
  const { mutate: updateLeadStatus, isPending } = useUpdateLeadStatus();
  const { mutate: deleteLead, isPending: isDeleting } = useDeleteLead();

  // Fetch full lead data when editing
  const { data: fullLeadData } = useQuery({
    queryKey: ["lead-for-edit", editingLead?.lead_id],
    queryFn: async () => {
      if (!editingLead?.lead_id) return null;
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("lead_id", editingLead.lead_id)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!editingLead?.lead_id,
  });

  // Total leads count
  const totalLeads = pipeline?.reduce((sum, col) => sum + col.leads.length, 0) || 0;

  const handleCardClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  const handleEditLead = async (e: React.MouseEvent, lead: CRMLead) => {
    e.stopPropagation();
    // Fetch full lead data for editing
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("lead_id", lead.lead_id)
      .single();
    
    if (data) {
      setEditingLead(data as Lead);
      setLeadDialogOpen(true);
    }
  };

  const handleAddLead = () => {
    setEditingLead(null);
    setLeadDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, lead: CRMLead) => {
    e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      deleteLead(leadToDelete.lead_id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setLeadToDelete(null);
          queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
        },
      });
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    const normalizedPhone = normalizePhoneForWhatsApp(phone);
    if (normalizedPhone) {
      window.open(`https://wa.me/${normalizedPhone}`, "_blank");
    }
  };

  const handleLeadDialogClose = (open: boolean) => {
    setLeadDialogOpen(open);
    if (!open) {
      setEditingLead(null);
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
    // Add a slight delay for visual feedback
    setTimeout(() => {
      const element = e.target as HTMLElement;
      element.style.opacity = "0.5";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
    const element = e.target as HTMLElement;
    element.style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent, status: CRMStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the column container
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-droppable="true"]')) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: CRMStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    setDraggedLeadId(null);
    setDragOverColumn(null);
    if (leadId) {
      updateLeadStatus({ leadId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton variant="kanban" metrics={0} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">CRM Comercial</h1>
            <p className="text-muted-foreground">
              Gerencie oportunidades e acompanhe o funil de vendas
            </p>
          </div>
          <Button onClick={handleAddLead} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>

        {/* Period Selector */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* Product Filter */}
        <ProductFilter
          selectedProduct={selectedProduct}
          onProductChange={setSelectedProduct}
        />

        {/* Total leads indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="font-medium">
            {totalLeads} {totalLeads === 1 ? "lead" : "leads"} no funil
          </Badge>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {pipeline?.map((column) => (
            <div 
              key={column.value} 
              className={cn(
                "flex-shrink-0 w-72 md:w-80 rounded-xl p-3 transition-all duration-200",
                dragOverColumn === column.value && "bg-primary/5 ring-2 ring-primary/30 ring-dashed"
              )}
              data-droppable="true"
              onDragOver={(e) => handleDragOver(e, column.value)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.value)}
            >
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-semibold">{column.label}</h3>
                  </div>
                  <Badge variant="secondary">{column.leads.length}</Badge>
                </div>
                <div className="h-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((column.leads.length / 10) * 100, 100)}%`,
                      backgroundColor: column.color,
                    }}
                  />
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[200px]">
                {column.leads.map((lead) => (
                  <Card
                    key={lead.lead_id}
                    className={cn(
                      "p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group",
                      "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
                      "active:scale-[0.98] active:shadow-md",
                      draggedLeadId === lead.lead_id && "opacity-50 scale-95 shadow-none"
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.lead_id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleCardClick(lead.lead_id)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Drag Handle */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${column.color}20` }}
                      >
                        <User className="w-5 h-5" style={{ color: column.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lead.name || "Sem nome"}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {lead.email || lead.phone || "Sem contato"}
                        </p>
                      </div>
                      {/* Action Buttons - visible on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {lead.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[hsl(160,55%,40%)] dark:text-[#CCFF00] hover:text-[hsl(160,55%,32%)] dark:hover:text-[#CCFF00] hover:bg-[rgba(16,185,129,0.10)] dark:hover:bg-[rgba(204,255,0,0.08)]"
                            onClick={(e) => handleWhatsAppClick(e, lead.phone)}
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => handleEditLead(e, lead)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, lead)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {lead.source || "Sem origem"}
                      </span>
                      {lead.utm_source && (
                        <Badge variant="outline">{lead.utm_source}</Badge>
                      )}
                    </div>
                  </Card>
                ))}

                {column.leads.length === 0 && (
                  <div className={cn(
                    "text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg transition-colors",
                    dragOverColumn === column.value ? "border-primary/50 bg-primary/5" : "border-transparent"
                  )}>
                    <p className="text-sm">
                      {dragOverColumn === column.value ? "Solte aqui" : "Nenhum lead neste status"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Resumo do Funil</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 md:gap-4">
            {CRM_STATUSES.map((status) => {
              const count = pipeline?.find(p => p.value === status.value)?.leads.length || 0;
              return (
                <div key={status.value} className="text-center">
                  <div className="text-2xl font-bold mb-1">{count}</div>
                  <div className="text-sm text-muted-foreground">{status.label}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {(isPending || isDeleting) && (
          <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {isDeleting ? "Excluindo contato..." : "Atualizando status..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lead Dialog - Add/Edit */}
      <LeadDialog
        open={leadDialogOpen}
        onOpenChange={handleLeadDialogClose}
        lead={editingLead}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o contato{" "}
              <strong>{leadToDelete?.name || "Sem nome"}</strong>?
              <br />
              <br />
              Esta ação irá remover permanentemente o contato e todos os dados
              associados (compras, eventos, tags, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CRM;
