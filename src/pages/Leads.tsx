import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Download, Users, Upload, TrendingUp, Calendar, ShoppingCart } from "lucide-react";
import { useLeads, useDeleteLead } from "@/hooks/useLeads";
import type { LeadsFilters, LeadWithProducts } from "@/hooks/useLeads";
import { useProducts } from "@/hooks/useProducts";
import { useCampaigns } from "@/hooks/useCampaigns";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadImportDialog } from "@/components/leads/LeadImportDialog";
import { UnificationReviewDialog } from "@/components/leads/UnificationReviewDialog";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { BulkTagActions } from "@/components/leads/BulkTagActions";
import { LeadsPagination } from "@/components/leads/LeadsPagination";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadTableRow } from "@/components/leads/LeadTableRow";
import { LeadSearchInput } from "@/components/leads/LeadSearchInput";
import { exportToCSV } from "@/lib/export/exportCSV";
import { getSourceLabel } from "@/lib/translations";
import { useLeadsSummary } from "@/hooks/useLeadsSummary";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"] & { products?: { name: string; slug: string | null }[] };

const Leads = () => {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<LeadWithProducts | null>(null);
  const [unificationDialogOpen, setUnificationDialogOpen] = useState(false);
  const [leadToUnify, setLeadToUnify] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const [filters, setFilters] = useState<LeadsFilters>({
    search: "",
    period: { type: "all" },
    source: undefined,
    productSlug: undefined,
    tagIds: [],
    // Advanced filters
    crmStatus: undefined,
    state: undefined,
    city: undefined,
    utmSource: undefined,
    utmCampaign: undefined,
    projectSlug: undefined,
    hasPurchase: undefined,
    noPurchase: undefined,
  });

  const { data: leadsResult, isLoading } = useLeads(filters, { page: currentPage, pageSize });
  const leads = leadsResult?.data as LeadWithProducts[] | undefined;
  const totalPages = leadsResult?.totalPages || 1;
  const totalCount = leadsResult?.total || 0;

  const deleteLead = useDeleteLead();
  const { data: summary } = useLeadsSummary(filters);

  const { data: allProducts } = useProducts();
  const { data: allCampaigns } = useCampaigns('all');

  const productColors = useMemo(() => {
    const map: Record<string, string> = {};
    allProducts?.forEach(p => {
      if ((p as any).color) map[p.slug] = (p as any).color;
    });
    return map;
  }, [allProducts]);

  const campaignColors = useMemo(() => {
    const map: Record<string, string> = {};
    allCampaigns?.forEach(c => {
      if (c.color) map[c.slug] = c.color;
    });
    return map;
  }, [allCampaigns]);

  const allSelected = useMemo(() => {
    if (!leads || leads.length === 0) return false;
    return leads.every(lead => selectedLeadIds.includes(lead.lead_id));
  }, [leads, selectedLeadIds]);

  const handleSelectAll = () => {
    if (!leads) return;
    if (allSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(lead => lead.lead_id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // Fetch all leads matching current filters (not just the current page)
      let query = supabase
        .from("leads")
        .select("lead_id, name, email, phone, cpf, source, crm_status, utm_source, utm_campaign, utm_medium, project_slug, city, state, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (filters?.search) {
        const sanitized = filters.search.replace(/[,.()"\\%*]/g, '');
        if (sanitized.trim()) {
          query = query.or(
            `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`
          );
        }
      }
      if (filters?.source) query = query.eq("source", filters.source);
      if (filters?.crmStatus) query = query.eq("crm_status", filters.crmStatus);
      if (filters?.projectSlug) query = query.eq("project_slug", filters.projectSlug);
      if (filters?.state) query = query.eq("state", filters.state);
      if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
      if (filters?.utmSource) query = query.eq("utm_source", filters.utmSource);
      if (filters?.utmCampaign) query = query.eq("utm_campaign", filters.utmCampaign);

      const { data: allLeads, error } = await query;
      if (error) throw error;
      if (!allLeads || allLeads.length === 0) return;

      const exportData = allLeads.map((lead) => ({
        Nome: lead.name || "",
        Email: lead.email || "",
        Telefone: lead.phone || "",
        CPF: lead.cpf || "",
        Origem: getSourceLabel(lead.source || ""),
        "UTM Source": lead.utm_source || "",
        "UTM Campaign": lead.utm_campaign || "",
        "UTM Medium": lead.utm_medium || "",
        Campanha: lead.project_slug || "",
        Cidade: lead.city || "",
        Estado: lead.state || "",
        "Data de Captura": lead.created_at ? new Date(lead.created_at).toLocaleDateString("pt-BR") : "",
      }));

      exportToCSV(exportData, `leads-${new Date().toISOString().split("T")[0]}`);
    } catch (err) {
      console.error("Error exporting leads:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (lead: LeadWithProducts) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleUnify = (leadId: string) => {
    setLeadToUnify(leadId);
    setUnificationDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (leadToDelete) {
      await deleteLead.mutateAsync(leadToDelete.lead_id);
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      // Remove from selection if it was selected
      setSelectedLeadIds(prev => prev.filter(id => id !== leadToDelete.lead_id));
    }
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFiltersChange = (newFilters: LeadsFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Leads</h1>
              <p className="text-muted-foreground">Gerencie e acompanhe todos os seus leads</p>
            </div>
          </div>
          <Card className="p-6 h-96 animate-pulse bg-muted/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Leads</h1>
            <p className="text-muted-foreground">Gerencie e acompanhe todos os seus leads</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting || !leads || leads.length === 0}>
              <Download className="w-4 h-4" />
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4" />
              Importar
            </Button>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
            <p className="text-2xl font-bold">{summary?.totalLeads?.toLocaleString() || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-foreground dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                <Calendar className="h-4 w-4 text-[#CCFF00]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Este Mês</p>
            <p className="text-2xl font-bold">{summary?.leadsThisMonth?.toLocaleString() || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Compradores</p>
            <p className="text-2xl font-bold">{summary?.buyers?.toLocaleString() || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.12)] dark:bg-[rgba(245,158,11,0.08)] flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[hsl(38,92%,50%)]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Conversão</p>
            <p className="text-2xl font-bold">{summary?.conversionRate || 0}%</p>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <LeadSearchInput
            value={filters.search || ""}
            onChange={handleSearchChange}
          />
        </Card>

        {/* Filters */}
        <Card className="p-4">
          <LeadFilters
            filters={filters}
            onChange={handleFiltersChange}
            resultCount={totalCount}
          />
        </Card>

        {/* Bulk Actions */}
        <BulkTagActions
          selectedLeadIds={selectedLeadIds}
          onClearSelection={() => setSelectedLeadIds([])}
        />

        {/* Leads Table */}
        {!leads || leads.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {filters.search || filters.source || filters.productSlug || (filters.tagIds && filters.tagIds.length > 0) || filters.crmStatus || filters.state || filters.city || filters.utmSource || filters.utmCampaign || filters.projectSlug || filters.hasPurchase || filters.noPurchase
                ? "Nenhum lead encontrado"
                : "Nenhum lead cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filters.search || filters.source || filters.productSlug || (filters.tagIds && filters.tagIds.length > 0) || filters.crmStatus || filters.state || filters.city || filters.utmSource || filters.utmCampaign || filters.projectSlug || filters.hasPurchase || filters.noPurchase
                ? "Tente ajustar seus filtros"
                : "Leads capturados através de webhooks, formulários e importações aparecerão aqui"}
            </p>
            {!filters.search && !filters.source && !filters.productSlug && (!filters.tagIds || filters.tagIds.length === 0) && !filters.crmStatus && !filters.state && !filters.city && !filters.utmSource && !filters.utmCampaign && !filters.projectSlug && !filters.hasPurchase && !filters.noPurchase && (
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Lead
              </Button>
            )}
          </Card>
        ) : isMobile ? (
          /* Mobile: Card View */
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.lead_id}
                lead={lead}
                isSelected={selectedLeadIds.includes(lead.lead_id)}
                onSelect={handleSelectLead}
                onUnify={handleUnify}
                onDelete={handleDelete}
                productColors={productColors}
                campaignColors={campaignColors}
              />
            ))}

            {/* Pagination */}
            <Card className="p-4">
              <div className="flex flex-col gap-3 items-center">
                <p className="text-sm text-muted-foreground">
                  {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} de {totalCount}
                </p>
                <LeadsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </Card>
          </div>
        ) : (
          /* Desktop: Simplified Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="min-w-[200px]">Lead</TableHead>
                    <TableHead className="min-w-[140px]">Telefone</TableHead>
                    <TableHead className="min-w-[180px]">Produto / Valor</TableHead>
                    <TableHead className="min-w-[140px]">Campanha / Data</TableHead>
                    <TableHead className="min-w-[100px]">Origem</TableHead>
                    <TableHead className="text-right min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <LeadTableRow
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLeadIds.includes(lead.lead_id)}
                      onSelect={handleSelectLead}
                      onUnify={handleUnify}
                      onDelete={handleDelete}
                      productColors={productColors}
                      campaignColors={campaignColors}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} de {totalCount} leads
              </p>
              <LeadsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Lead Dialog */}
      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Import Dialog */}
      <LeadImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Unification Review Dialog */}
      {leadToUnify && (
        <UnificationReviewDialog
          open={unificationDialogOpen}
          onOpenChange={setUnificationDialogOpen}
          leadId={leadToUnify}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{leadToDelete?.name}"? Esta ação não pode ser
              desfeita e todos os eventos associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Leads;
