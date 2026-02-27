import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MousePointer,
  ShoppingCart,
  CheckCircle,
  Edit2,
  Save,
  Trash2,
  ArrowLeft,
  Briefcase,
  Plus,
  Target,
  Tag,
} from "lucide-react";
import { LeadMQLBadge } from "@/components/leads/LeadMQLBadge";
import { extractMQLFromMetadata } from "@/hooks/useLeadScore";
import { useClientSummary } from "@/hooks/useClientSummary";
import { useLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { useLeadEvents } from "@/hooks/useLeadEvents";
import { usePurchases, useCreatePurchase, useUpdatePurchase, useDeletePurchase } from "@/hooks/usePurchases";
import { useCampaigns } from "@/hooks/useCampaigns";
import { MergeLogsTimeline } from "@/components/leads/MergeLogsTimeline";
import { LeadTimeline } from "@/components/leads/LeadTimeline";
import { SendToFinancialDialog } from "@/components/leads/SendToFinancialDialog";
import { LeadFunnelView } from "@/components/leads/LeadFunnelView";
import { PurchaseDialog } from "@/components/leads/PurchaseDialog";
import { LeadVersionHistory } from "@/components/leads/LeadVersionHistory";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Package, TrendingUp, Activity, MessageCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { getEventLabel, getPurchaseStatusLabel, getPaymentMethodLabel, getSourceLabel, getCampaignStatus, getCampaignStatusBadge } from "@/lib/translations";
import { normalizePhoneForWhatsApp } from "@/lib/utils";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

const eventIcons: Record<string, any> = {
  lead_created: User,
  lead_updated: Edit2,
  email_opened: Mail,
  link_clicked: MousePointer,
  cart_added: ShoppingCart,
  purchase_completed: CheckCircle,
};

const eventColors: Record<string, string> = {
  lead_created: "hsl(160, 55%, 40%)",
  lead_updated: "hsl(38, 92%, 50%)",
  email_opened: "hsl(160, 55%, 40%)",
  link_clicked: "hsl(38, 92%, 50%)",
  cart_added: "hsl(38, 92%, 50%)",
  purchase_completed: "hsl(160, 55%, 40%)",
};

const LeadProfile = () => {
  const { id: leadId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);

  const { data: lead, isLoading } = useLead(leadId || "");
  const { data: campaigns = [] } = useCampaigns();
  const { data: events } = useLeadEvents(leadId || "");
  const { data: purchases } = usePurchases(leadId);
  const { data: clientSummary } = useClientSummary(leadId || "");
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const deletePurchaseMutation = useDeletePurchase();

  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const sourceValue = watch("source");
  const clientTypeValue = watch("client_type");

  // Inicializa o formulário quando entra em modo de edição
  useEffect(() => {
    if (isEditing && lead) {
      reset({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        cpf: lead.cpf || "",
        crm_status: lead.crm_status || "lead",
        client_type: (lead as any).client_type || "",
        source: lead.source || "",
        project_slug: lead.project_slug || "",
        utm_source: lead.utm_source || "",
        utm_medium: lead.utm_medium || "",
        utm_campaign: lead.utm_campaign || "",
        utm_content: lead.utm_content || "",
        utm_term: lead.utm_term || "",
      });
    }
  }, [isEditing, lead, reset]);

  const onSubmit = async (data: any) => {
    if (!leadId) return;

    await updateLead.mutateAsync({
      leadId,
      updates: data,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!leadId) return;
    await deleteLead.mutateAsync(leadId);
    navigate("/leads");
  };

  const handleSavePurchase = async (data: any) => {
    if (!leadId) return;

    if (editingPurchase) {
      await updatePurchase.mutateAsync({
        id: editingPurchase.id,
        updates: data,
      });
    } else {
      await createPurchase.mutateAsync({
        ...data,
        lead_id: leadId,
      });
    }
    setEditingPurchase(null);
  };

  const handleDeletePurchase = async () => {
    if (!deletePurchaseId || !leadId) return;
    await deletePurchaseMutation.mutateAsync({
      id: deletePurchaseId,
      leadId,
    });
    setDeletePurchaseId(null);
  };

  if (isLoading || !lead) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="p-6 h-96 animate-pulse bg-muted/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" className="gap-2" onClick={() => navigate("/leads")}>
          <ArrowLeft className="w-4 h-4" />
          Voltar para Leads
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">{lead.name || "Lead sem nome"}</h1>
              {(() => {
                const mqlData = extractMQLFromMetadata(lead.metadata);
                return (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        lead.crm_status === "comprador" 
                          ? "bg-success/10 text-success border-success/20" 
                          : lead.crm_status === "perdido"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : lead.crm_status === "carrinho"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : lead.crm_status === "aquecido"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted/50 text-muted-foreground border-border"
                      }
                    >
                      {lead.crm_status === "lead" && "Lead Capturado"}
                      {lead.crm_status === "engajado" && "Engajado"}
                      {lead.crm_status === "aquecido" && "Aquecido"}
                      {lead.crm_status === "carrinho" && "Carrinho"}
                      {lead.crm_status === "comprador" && "Comprador"}
                      {lead.crm_status === "perdido" && "Perdido"}
                      {!lead.crm_status && "Lead Capturado"}
                    </Badge>
                    <LeadMQLBadge score={mqlData.mql_score} level={mqlData.mql_level} />
                  </div>
                );
              })()}
              {/* Lead Tags */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {lead.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                        borderColor: tag.color || undefined,
                        color: tag.color || undefined
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lead.phone && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-[hsl(160,55%,40%)] dark:text-[#CCFF00] hover:text-[hsl(160,55%,32%)] dark:hover:text-[#CCFF00] hover:bg-[rgba(16,185,129,0.08)] dark:hover:bg-[rgba(204,255,0,0.08)]"
                onClick={() => {
                  const normalizedPhone = normalizePhoneForWhatsApp(lead.phone || "");
                  window.open(`https://api.whatsapp.com/send/?phone=${normalizedPhone}&type=phone_number&app_absent=0`, "_blank");
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setFinancialDialogOpen(true)}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </Button>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => {
                if (isEditing) {
                  handleSubmit(onSubmit)();
                } else {
                  reset(lead);
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Status CRM</p>
            <p className="text-lg font-bold">
              <Badge variant="outline" className="text-xs">
                {lead.crm_status === "lead" && "Lead Capturado"}
                {lead.crm_status === "engajado" && "Engajado"}
                {lead.crm_status === "aquecido" && "Aquecido"}
                {lead.crm_status === "carrinho" && "Carrinho"}
                {lead.crm_status === "comprador" && "Comprador"}
                {lead.crm_status === "perdido" && "Perdido"}
                {!lead.crm_status && "Lead Capturado"}
              </Badge>
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[hsl(160,55%,40%)] dark:text-[#CCFF00]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Valor Total (LTV)</p>
            <p className="text-base font-semibold text-[hsl(160,55%,40%)] dark:text-[#CCFF00] truncate">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(clientSummary?.totalValue || 0)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-foreground dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-[#CCFF00]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Total Compras</p>
            <p className="text-base font-semibold">{clientSummary?.totalPurchases || 0}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Produtos</p>
            <p className="text-base font-semibold">
              {clientSummary?.products.length || 0}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Ticket Médio</p>
            <p className="text-base font-semibold truncate">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(clientSummary?.averageTicket || 0)}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-foreground dark:bg-[rgba(204,255,0,0.08)] flex items-center justify-center">
                <Activity className="h-4 w-4 text-[#CCFF00]" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Tipo Cliente</p>
            <Badge 
              variant={clientSummary?.isRecurringClient ? "default" : "secondary"}
              className={clientSummary?.isRecurringClient ? "bg-[rgba(16,185,129,0.10)] dark:bg-[rgba(204,255,0,0.08)] text-[hsl(160,55%,40%)] dark:text-[#CCFF00] border-[rgba(16,185,129,0.20)] dark:border-[rgba(204,255,0,0.15)]" : ""}
            >
              {clientSummary?.isRecurringClient ? "Recorrente" : clientSummary?.totalPurchases ? "Cliente" : "Lead"}
            </Badge>
          </Card>
        </div>

        {/* Lead Journey Funnel */}
        <div className="mb-6">
          <LeadFunnelView currentStatus={lead.crm_status || "lead"} />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Calendar className="h-3 w-3" />
          <span>Lead desde: {new Date(lead.created_at!).toLocaleDateString("pt-BR")}</span>
          <span>•</span>
          <span>
            Última atualização:{" "}
            {new Date(lead.updated_at!).toLocaleString("pt-BR")}
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="purchases"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Compras
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger
              value="origin"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Origem & UTMs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Atividade Recente</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-primary"
                  onClick={() => {
                    const tabsTrigger = document.querySelector('[data-state="inactive"][value="timeline"]') as HTMLElement;
                    tabsTrigger?.click();
                  }}
                >
                  Ver tudo →
                </Button>
              </div>
              <LeadTimeline 
                events={events || []} 
                purchases={purchases || []} 
                maxItems={5}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Histórico de Unificação</h3>
              <MergeLogsTimeline leadId={leadId || ""} />
            </div>

            <div>
              <LeadVersionHistory leadId={leadId || ""} />
            </div>
          </TabsContent>

          {/* Timeline Tab - Full History */}
          <TabsContent value="timeline" className="space-y-6 mt-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Histórico Completo</h3>
                  <p className="text-xs text-muted-foreground">
                    Todos os eventos, compras e interações do lead
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {(events?.length || 0) + (purchases?.length || 0)} atividades
                </Badge>
              </div>
              <Card className="p-4">
                <LeadTimeline 
                  events={events || []} 
                  purchases={purchases || []} 
                />
              </Card>
            </div>
          </TabsContent>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="space-y-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Compras</h3>
              <Button
                onClick={() => {
                  setEditingPurchase(null);
                  setPurchaseDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Compra
              </Button>
            </div>

            {!purchases || purchases.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma compra registrada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione compras manualmente ou elas serão sincronizadas automaticamente via webhooks
                </p>
                <Button
                  onClick={() => {
                    setEditingPurchase(null);
                    setPurchaseDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Primeira Compra
                </Button>
              </Card>
            ) : (
              purchases.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{purchase.product_name}</h3>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              purchase.status === "approved"
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }
                          >
                            {getPurchaseStatusLabel(purchase.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {purchase.purchase_date
                              ? new Date(purchase.purchase_date).toLocaleDateString("pt-BR")
                              : "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                          <p className="text-xl font-bold text-success">
                            R$ {Number(purchase.value).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPurchase(purchase);
                            setPurchaseDialogOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletePurchaseId(purchase.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Origem</p>
                        <p className="font-medium">{getSourceLabel(purchase.utm_source)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Campanha</p>
                        <p className="font-medium">{purchase.utm_campaign || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Método</p>
                        <p className="font-medium">{getPaymentMethodLabel(purchase.payment_method)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Personal Data Tab */}
          <TabsContent value="personal" className="space-y-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSubmit(onSubmit)}>
                      Salvar
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  {isEditing ? (
                    <Input {...register("name")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.name || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {isEditing ? (
                    <Input {...register("email")} type="email" className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.email || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Telefone</Label>
                  {isEditing ? (
                    <Input {...register("phone")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.phone || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">CPF</Label>
                  {isEditing ? (
                    <Input {...register("cpf")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.cpf || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Status CRM</Label>
                  {isEditing ? (
                    <Select
                      value={watch("crm_status") || lead.crm_status || "lead"}
                      onValueChange={(value) => setValue("crm_status", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead Capturado</SelectItem>
                        <SelectItem value="engajado">Engajado</SelectItem>
                        <SelectItem value="aquecido">Aquecido</SelectItem>
                        <SelectItem value="carrinho">Carrinho</SelectItem>
                        <SelectItem value="comprador">Comprador</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {lead.crm_status === "lead" && "Lead Capturado"}
                      {lead.crm_status === "engajado" && "Engajado"}
                      {lead.crm_status === "aquecido" && "Aquecido"}
                      {lead.crm_status === "carrinho" && "Carrinho"}
                      {lead.crm_status === "comprador" && "Comprador"}
                      {lead.crm_status === "perdido" && "Perdido"}
                      {!lead.crm_status && "Lead Capturado"}
                    </p>
                )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de Cliente</Label>
                  {isEditing ? (
                    <Select
                      value={clientTypeValue || (lead as any).client_type || ""}
                      onValueChange={(value) => setValue("client_type", value === "auto" ? "" : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Automático (baseado em compras)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">🔄 Automático (baseado em compras)</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="recorrente">Recorrente</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {(lead as any).client_type === "lead" && "Lead"}
                      {(lead as any).client_type === "cliente" && "Cliente"}
                      {(lead as any).client_type === "recorrente" && "Recorrente"}
                      {(lead as any).client_type === "vip" && "VIP"}
                      {!(lead as any).client_type && (
                        <span className="text-muted-foreground">
                          {clientSummary?.isRecurringClient ? "Recorrente (auto)" : clientSummary?.totalPurchases ? "Cliente (auto)" : "Lead (auto)"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Origin & UTMs Tab */}
          <TabsContent value="origin" className="space-y-6 mt-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Dados de Origem</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Origem (Source)</Label>
                  {isEditing ? (
                    <Select
                      value={watch("source") || lead.source || ""}
                      onValueChange={(value) => setValue("source", value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="import">Importação</SelectItem>
                        <SelectItem value="hotmart">Hotmart</SelectItem>
                        <SelectItem value="manychat">ManyChat</SelectItem>
                        <SelectItem value="n8n">N8N</SelectItem>
                        <SelectItem value="tracking_pixel">Tracking Pixel</SelectItem>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="organic">Orgânico</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.source || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Projeto / Campanha</Label>
                  {isEditing ? (
                    <Select
                      value={watch("project_slug") || lead.project_slug || ""}
                      onValueChange={(value) => setValue("project_slug", value === "none" ? "" : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione uma campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma campanha</SelectItem>
                        <SelectItem value={`vendas-mes-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}>
                          📅 Vendas do Mês ({new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })})
                        </SelectItem>
                        {campaigns.map((campaign) => {
                          const status = getCampaignStatus(campaign);
                          const badge = getCampaignStatusBadge(status);
                          return (
                            <SelectItem key={campaign.id} value={campaign.slug}>
                              {badge} {campaign.name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {campaigns.find(c => c.slug === lead.project_slug)?.name || lead.project_slug || "—"}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">UTM Source</Label>
                  {isEditing ? (
                    <Input {...register("utm_source")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.utm_source || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">UTM Medium</Label>
                  {isEditing ? (
                    <Input {...register("utm_medium")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.utm_medium || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">UTM Campaign</Label>
                  {isEditing ? (
                    <Input {...register("utm_campaign")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.utm_campaign || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">UTM Content</Label>
                  {isEditing ? (
                    <Input {...register("utm_content")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.utm_content || "—"}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">UTM Term</Label>
                  {isEditing ? (
                    <Input {...register("utm_term")} className="mt-1" />
                  ) : (
                    <p className="text-sm font-medium mt-1">{lead.utm_term || "—"}</p>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead "{lead.name}"? Esta ação não pode ser desfeita
              e todos os eventos associados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send to Financial Dialog */}
      <SendToFinancialDialog
        open={financialDialogOpen}
        onOpenChange={setFinancialDialogOpen}
        lead={lead}
        purchases={purchases || []}
      />

      {/* Purchase Dialog */}
      <PurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={(open) => {
          setPurchaseDialogOpen(open);
          if (!open) setEditingPurchase(null);
        }}
        leadId={leadId || ""}
        purchase={editingPurchase}
        onSave={handleSavePurchase}
      />

      {/* Delete Purchase Confirmation */}
      <AlertDialog open={!!deletePurchaseId} onOpenChange={() => setDeletePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePurchase} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default LeadProfile;
