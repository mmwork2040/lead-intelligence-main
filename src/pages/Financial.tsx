import { useState } from "react";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import MetricCard from "@/components/MetricCard";
import { 
  DollarSign, 
  TrendingDown, 
  Download,
  Check,
  FileText,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PageSkeleton, ListSkeleton } from "@/components/ui/page-skeleton";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useInvoiceRequests, useUpdateInvoiceRequestStatus, useCreateInvoiceRequest } from "@/hooks/useInvoiceRequests";
import { useTransactions, type Transaction } from "@/hooks/useTransactions";
import { useProducts } from "@/hooks/useProducts";
import { exportInvoicesToCSV } from "@/lib/export/exportInvoices";
import { exportToCSV } from "@/lib/export/exportCSV";
import { toast } from "sonner";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter, getPeriodLabel } from "@/lib/dateUtils";
import { InvoicePeriodFilter } from "@/components/financial/InvoicePeriodFilter";
import { RevenueBySourceChart } from "@/components/financial/RevenueBySourceChart";
import { PageAIInsights } from "@/components/ai/PageAIInsights";

const Financial = () => {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<"sent" | "issued">("sent");
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [showReissueDialog, setShowReissueDialog] = useState(false);
  const [reissueTransaction, setReissueTransaction] = useState<any>(null);
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  
  // Default to previous month (NFs are issued the month after purchase)
  const [invoiceDateRange, setInvoiceDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: startOfMonth(subMonths(new Date(), 1)),
    endDate: endOfMonth(subMonths(new Date(), 1)),
  });

  const { data: metrics, isLoading: metricsLoading } = useFinancialMetrics(period);
  const { data: products } = useProducts();
  
  const { data: invoiceRequests, isLoading: invoicesLoading } = useInvoiceRequests({
    status: activeTab === "all" ? undefined : activeTab,
    startDate: invoiceDateRange.startDate ? format(invoiceDateRange.startDate, "yyyy-MM-dd") : undefined,
    endDate: invoiceDateRange.endDate ? format(invoiceDateRange.endDate, "yyyy-MM-dd") : undefined,
    productName: selectedProduct === "all" ? undefined : selectedProduct,
  });
  
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(1, 10);
  const updateStatus = useUpdateInvoiceRequestStatus();
  const createInvoice = useCreateInvoiceRequest();

  const handleInvoiceDateChange = (start: Date | null, end: Date | null) => {
    setInvoiceDateRange({ startDate: start, endDate: end });
  };

  const handleSelectAll = () => {
    if (!invoiceRequests) return;
    if (selectedInvoices.length === invoiceRequests.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoiceRequests.map((inv) => inv.id));
    }
  };

  const handleToggleInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((invId) => invId !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    if (!invoiceRequests || selectedInvoices.length === 0) {
      toast.error("Selecione pelo menos uma solicitação para exportar");
      return;
    }

    const selectedData = invoiceRequests.filter((inv) =>
      selectedInvoices.includes(inv.id)
    );

    exportInvoicesToCSV(selectedData);
    toast.success(`${selectedInvoices.length} solicitações exportadas`);
  };

  const handleUpdateStatus = (status: "sent" | "issued") => {
    if (selectedInvoices.length === 0) {
      toast.error("Selecione pelo menos uma solicitação");
      return;
    }
    setActionType(status);
    setShowConfirmDialog(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      await updateStatus.mutateAsync({
        ids: selectedInvoices,
        status: actionType,
      });
      setSelectedInvoices([]);
      setShowConfirmDialog(false);
      toast.success(
        `${selectedInvoices.length} solicitações marcadas como ${
          actionType === "sent" ? "enviadas" : "emitidas"
        }`
      );
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleReissue = async () => {
    if (!reissueTransaction) return;
    
    try {
      await createInvoice.mutateAsync({
        lead_id: reissueTransaction.lead_id,
        purchase_id: reissueTransaction.id,
        lead_name: reissueTransaction.leads?.name || null,
        lead_email: reissueTransaction.leads?.email || null,
        lead_cpf: null,
        lead_phone: null,
        value: reissueTransaction.gross_value || reissueTransaction.value,
        description: reissueTransaction.product_name,
        status: "pending",
      });
      setShowReissueDialog(false);
      setReissueTransaction(null);
      toast.success("Nova solicitação de NF criada");
    } catch (error) {
      toast.error("Erro ao reemitir NF");
    }
  };

  const totalSelected = invoiceRequests
    ?.filter((inv) => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + (inv.value || 0), 0) || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      pending: { label: "Pendente", variant: "default" },
      sent: { label: "Enviado", variant: "secondary" },
      issued: { label: "Emitido", variant: "outline" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (metricsLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton variant="table" metrics={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão financeira e emissão de notas</p>
        </div>

        {/* Period Selector */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* AI Insights */}
        <PageAIInsights
          title="Insights de IA — Financeiro"
          context="financial"
          canGenerate={(metrics?.revenue || 0) > 0}
          isLoading={metricsLoading}
          resetKeys={[period.type, (period as any).startDate, (period as any).endDate]}
          prompt={`Analise os dados financeiros abaixo e forneça insights estratégicos em português brasileiro:

Período: ${getPeriodLabel(period)}
- Receita: R$ ${(metrics?.revenue ?? 0).toLocaleString("pt-BR")}
- Reembolsos: R$ ${(metrics?.refunds ?? 0).toLocaleString("pt-BR")}
- Receita Recorrente: R$ ${(metrics?.recurringRevenue ?? 0).toLocaleString("pt-BR")}
- Receita por Fonte: ${JSON.stringify(metrics?.revenueBySource ?? [])}

Responda com:
1. Resumo executivo (1-2 frases)
2. 3-5 insights específicos numerados com emojis sobre a saúde financeira
3. 2-3 ações recomendadas para otimização de receita

Seja conciso e direto. Use dados concretos. Responda em português brasileiro.`}
        />

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Receita"
            value={`R$ ${(metrics?.revenue ?? 0).toLocaleString("pt-BR")}`}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
          />
          <MetricCard
            title="Reembolsos"
            value={`R$ ${(metrics?.refunds ?? 0).toLocaleString("pt-BR")}`}
            icon={<TrendingDown className="h-5 w-5 text-warning" />}
          />
          <MetricCard
            title="Receita Recorrente"
            value={`R$ ${(metrics?.recurringRevenue ?? 0).toLocaleString("pt-BR")}`}
            icon={<RefreshCw className="h-5 w-5 text-accent" />}
          />
        </div>

        {/* Receita por Fonte */}
        <RevenueBySourceChart data={metrics?.revenueBySource ?? []} />

        {/* Seção de Pedidos de NF */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Solicitações de Nota Fiscal</h2>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <InvoicePeriodFilter
                  startDate={invoiceDateRange.startDate}
                  endDate={invoiceDateRange.endDate}
                  onDateChange={handleInvoiceDateChange}
                />

                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (invoiceRequests && invoiceRequests.length > 0) {
                    exportInvoicesToCSV(invoiceRequests, `compradores-nf-${format(new Date(), "yyyy-MM-dd")}`);
                    toast.success(`${invoiceRequests.length} registros exportados com sucesso`);
                  } else {
                    toast.error("Nenhum registro encontrado para exportar");
                  }
                }}
                disabled={!invoiceRequests || invoiceRequests.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Todos ({invoiceRequests?.length || 0})
              </Button>
            </div>

            {/* Tabs por Status */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto">
                <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4">
                  <TabsTrigger value="all" className="flex-shrink-0">
                    Todas
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex-shrink-0">
                    <span className="hidden sm:inline">🔴 </span>Pendentes
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex-shrink-0">
                    <span className="hidden sm:inline">🟡 </span>Enviadas
                  </TabsTrigger>
                  <TabsTrigger value="issued" className="flex-shrink-0">
                    <span className="hidden sm:inline">🟢 </span>Emitidas
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {/* Ações */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      invoiceRequests?.length > 0 &&
                      selectedInvoices.length === invoiceRequests.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Selecionar todos</span>

                  <div className="flex-1" />

                  {selectedInvoices.length > 0 && (
                    <>
                      <Button onClick={handleExportSelected} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </Button>

                      {activeTab === "pending" && (
                        <Button
                          onClick={() => handleUpdateStatus("sent")}
                          variant="default"
                          size="sm"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Marcar como Enviado
                        </Button>
                      )}

                      {activeTab === "sent" && (
                        <Button
                          onClick={() => handleUpdateStatus("issued")}
                          variant="default"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Marcar como Emitido
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Tabela de Solicitações */}
                {invoicesLoading ? (
                  <ListSkeleton count={3} />
                ) : !invoiceRequests || invoiceRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="w-12 p-3"></th>
                          <th className="text-left p-3 whitespace-nowrap">Data Compra</th>
                          <th className="text-left p-3 whitespace-nowrap">Mês Emissão</th>
                          <th className="text-left p-3 whitespace-nowrap">Cliente</th>
                          <th className="text-left p-3 whitespace-nowrap">CPF</th>
                          <th className="text-left p-3 whitespace-nowrap">Produto</th>
                          <th className="text-right p-3 whitespace-nowrap">Valor</th>
                          <th className="text-center p-3 whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoiceRequests.map((invoice) => {
                          const purchaseDate = invoice.purchases?.purchase_date || invoice.created_at;
                          const issueMonth = purchaseDate 
                            ? (() => {
                                const date = new Date(purchaseDate);
                                const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
                                return nextMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                              })()
                            : "-";
                          
                          return (
                            <tr key={invoice.id} className="hover:bg-muted/30">
                              <td className="p-3">
                                <Checkbox
                                  checked={selectedInvoices.includes(invoice.id)}
                                  onCheckedChange={() => handleToggleInvoice(invoice.id)}
                                />
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {new Date(purchaseDate || "").toLocaleDateString("pt-BR")}
                              </td>
                              <td className="p-3 whitespace-nowrap capitalize">
                                {issueMonth}
                              </td>
                              <td className="p-3">{invoice.lead_name || "-"}</td>
                              <td className="p-3 font-mono text-sm">{invoice.lead_cpf || "-"}</td>
                              <td className="p-3">{invoice.description || "-"}</td>
                              <td className="p-3 text-right font-semibold whitespace-nowrap">
                                R$ {Number(invoice.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-center">{getStatusBadge(invoice.status)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Total Selecionado */}
                {selectedInvoices.length > 0 && (
                  <div className="flex justify-end items-center gap-2 text-lg font-semibold">
                    <span className="text-muted-foreground">Total selecionado:</span>
                    <span className="text-primary">
                      R$ {totalSelected.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Transações Recentes */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Transações Recentes</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (transactionsData?.transactions) {
                    exportToCSV(
                      transactionsData.transactions.map((t: Transaction) => ({
                        Data: new Date(t.purchase_date || "").toLocaleDateString("pt-BR"),
                        Produto: t.product_name,
                        Cliente: t.leads?.name || "-",
                        Valor: t.value,
                        Status: t.status,
                        "Método Pagamento": t.payment_method || "-",
                        "Status NF": t.invoice_requests?.[0]?.status || "-",
                      })),
                      "transacoes"
                    );
                    toast.success("Transações exportadas com sucesso");
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            {transactionsLoading ? (
              <ListSkeleton count={3} />
            ) : !transactionsData?.transactions || transactionsData.transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 whitespace-nowrap">Data</th>
                      <th className="text-left p-3 whitespace-nowrap">Produto</th>
                      <th className="text-left p-3 whitespace-nowrap">Cliente</th>
                      <th className="text-left p-3 whitespace-nowrap">CPF</th>
                      <th className="text-left p-3 whitespace-nowrap">Origem</th>
                      <th className="text-left p-3 whitespace-nowrap">Pagamento</th>
                      <th className="text-right p-3 whitespace-nowrap">Valor</th>
                      <th className="text-center p-3 whitespace-nowrap">Status</th>
                      <th className="text-center p-3 whitespace-nowrap">NF</th>
                      <th className="text-center p-3 whitespace-nowrap">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactionsData.transactions.map((transaction: Transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap">
                          {new Date(transaction.purchase_date || "").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-3">{transaction.product_name}</td>
                        <td className="p-3">{transaction.leads?.name || "-"}</td>
                        <td className="p-3 font-mono text-sm">{transaction.leads?.cpf || "-"}</td>
                        <td className="p-3">
                          {transaction.leads?.source || transaction.leads?.utm_source || "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="text-sm">{transaction.payment_method || "-"}</span>
                            {transaction.installments && transaction.installments > 1 && (
                              <span className="text-xs text-muted-foreground">{transaction.installments}x</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-semibold whitespace-nowrap">
                          R$ {Number(transaction.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={transaction.status === "approved" ? "success" : "secondary"}>
                            {transaction.status === "approved" ? "Aprovada" : transaction.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          {transaction.invoice_requests?.[0] ? (
                            getStatusBadge(transaction.invoice_requests[0].status)
                          ) : (
                            <Badge variant="outline">-</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setReissueTransaction(transaction);
                              setShowReissueDialog(true);
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar {selectedInvoices.length} solicitação(ões) como{" "}
              {actionType === "sent" ? "enviadas" : "emitidas"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusUpdate}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Reemissão */}
      <AlertDialog open={showReissueDialog} onOpenChange={setShowReissueDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reemitir Nota Fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja criar uma nova solicitação de NF para a transação de{" "}
              <strong>{reissueTransaction?.product_name}</strong> no valor de{" "}
              <strong>R$ {Number(reissueTransaction?.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReissue}>Criar Solicitação</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Financial;
