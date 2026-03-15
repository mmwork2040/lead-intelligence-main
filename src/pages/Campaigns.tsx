import { useState, lazy, Suspense, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/page-skeleton";
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
import { Plus, TrendingUp, Users, DollarSign, Target, Edit2, Trash2, Power, Search, Code, Layers } from "lucide-react";

import { useCampaigns, useCampaignMetrics, useDeleteCampaign, useCampaignCounts, useToggleCampaignStatus, type CampaignFilter } from "@/hooks/useCampaigns";
import { CampaignDialog } from "@/components/campaigns/CampaignDialog";
import { CampaignGoalsSection } from "@/components/campaigns/CampaignGoalsSection";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & { is_active?: boolean };

const CampaignCard = ({
  campaign,
  period,
  onEdit,
  onDelete,
  onToggleStatus
}: {
  campaign: Campaign;
  period: PeriodFilter;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) => {
  const dateRange = period.type === "all" ? undefined : calculateDateRange(period);
  const { data: metrics } = useCampaignMetrics(campaign.slug, dateRange);
  const isActive = campaign.is_active !== false;

  return (
    <Card className={cn(
      "p-6 transition-smooth hover:shadow-custom-lg relative",
      !isActive && "opacity-60"
    )}>
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          title="Editar"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8",
            isActive ? "text-success hover:text-success" : "text-muted-foreground"
          )}
          onClick={onToggleStatus}
          title={isActive ? "Desativar" : "Ativar"}
        >
          <Power className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6 pr-28">
        <div
          className="w-3 h-12 rounded-full flex-shrink-0"
          style={{ backgroundColor: campaign.color || "#3B82F6" }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
            <Badge
              variant="outline"
              className={cn(
                "flex-shrink-0",
                isActive
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-muted text-muted-foreground border-muted"
              )}
            >
              {isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {campaign.start_date && new Date(campaign.start_date).toLocaleDateString("pt-BR")}
            {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString("pt-BR")}`}
            {!campaign.start_date && !campaign.end_date && "Sem datas definidas"}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            Leads
          </div>
          <p className="text-lg font-semibold">{metrics?.leads.toLocaleString() || 0}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            Vendas
          </div>
          <p className="text-lg font-semibold">{metrics?.sales.toLocaleString() || 0}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            Receita
          </div>
          <p className="text-lg font-semibold break-all">
            R$ {metrics?.revenue ? (metrics.revenue / 1000).toFixed(1) : "0"}k
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            ROAS
          </div>
          <p className="text-lg font-semibold">{metrics?.roas.toFixed(1) || "0"}x</p>
        </div>
      </div>

      {/* Investment */}
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Investimento</span>
          <span className="font-semibold">
            R$ {Number(campaign.ad_spend || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Goals Section */}
      <CampaignGoalsSection
        campaignId={campaign.id}
        campaignStartDate={campaign.start_date || new Date().toISOString()}
        campaignEndDate={campaign.end_date || new Date().toISOString()}
      />
    </Card>
  );
};

const Campaigns = ({ openDialog }: { openDialog?: boolean } = {}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (openDialog) {
      setDialogOpen(true);
    }
  }, [openDialog]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  const [filter, setFilter] = useState<CampaignFilter>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: campaigns, isLoading } = useCampaigns(filter);
  const { data: counts } = useCampaignCounts();
  const deleteCampaign = useDeleteCampaign();
  const toggleStatus = useToggleCampaignStatus();

  // Filtrar por busca
  const filteredCampaigns = campaigns?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setDialogOpen(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = (campaign: Campaign) => {
    toggleStatus.mutate({
      id: campaign.id,
      is_active: campaign.is_active === false
    });
  };

  const confirmDelete = async () => {
    if (campaignToDelete) {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleNewCampaign = () => {
    setSelectedCampaign(null);
    setDialogOpen(true);
  };

  const filterButtons: { key: CampaignFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: counts?.total || 0 },
    { key: 'active', label: 'Ativas', count: counts?.active || 0 },
    { key: 'inactive', label: 'Inativas', count: counts?.inactive || 0 },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2">
            {filterButtons.map((btn) => (
              <Button
                key={btn.key}
                variant={filter === btn.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(btn.key)}
                className="gap-2"
              >
                {btn.label}
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 h-5 px-1.5 text-xs",
                    filter === btn.key && "bg-primary-foreground/20 text-primary-foreground"
                  )}
                >
                  {btn.count}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar campanha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Period Selector */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* Campaigns Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 h-64 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm
                ? "Nenhuma campanha encontrada"
                : filter === 'inactive'
                  ? "Nenhuma campanha inativa"
                  : filter === 'active'
                    ? "Nenhuma campanha ativa"
                    : "Nenhuma campanha cadastrada"
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Tente buscar por outro termo"
                : "Crie sua primeira campanha para começar a rastrear leads e vendas"
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button onClick={handleNewCampaign} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeira Campanha
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                period={period}
                onEdit={() => handleEdit(campaign)}
                onDelete={() => handleDelete(campaign)}
                onToggleStatus={() => handleToggleStatus(campaign)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Campaign Dialog */}
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={selectedCampaign}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a campanha "{campaignToDelete?.name}"? Esta ação não
              pode ser desfeita e todos os dados associados serão perdidos.
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
    </>
  );
};

export default Campaigns;