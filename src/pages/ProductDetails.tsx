import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import { ArrowLeft, Package, DollarSign, TrendingUp, Users, Calendar, ShoppingCart, Pencil } from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useProductOffers } from "@/hooks/useProductOffers";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter, calculateDateRange } from "@/lib/dateUtils";
import { ProductDialog } from "@/components/products/ProductDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

const productTypeLabels: Record<string, string> = {
  curso: "Curso",
  mentoria: "Mentoria",
  ebook: "E-book",
  evento: "Evento",
  outro: "Outro",
};

const chartConfig = {
  revenue: {
    label: "Receita",
    color: "hsl(var(--success))",
  },
  sales: {
    label: "Vendas",
    color: "hsl(var(--primary))",
  },
};

const ProductDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: product, isLoading: productLoading } = useProduct(slug || "");
  const { data: offers } = useProductOffers(product?.id);

  // Fetch purchases for this product
  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["product-purchases", product?.slug, period],
    queryFn: async () => {
      if (!product?.slug) return [];
      const { startDate, endDate } = calculateDateRange(period);

      const { data, error } = await supabase
        .from("purchases")
        .select("*")
        .eq("product_slug", product.slug)
        .gte("purchase_date", startDate.toISOString())
        .lte("purchase_date", endDate.toISOString())
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      return data as Purchase[];
    },
    enabled: !!product?.slug,
  });

  // Calculate metrics from purchases
  const metrics = {
    totalSales: purchases?.filter(p => p.status === "approved").length || 0,
    totalRevenue: purchases?.filter(p => p.status === "approved").reduce((sum, p) => sum + (p.value || 0), 0) || 0,
    refunds: purchases?.filter(p => p.status === "refunded").length || 0,
    pending: purchases?.filter(p => p.status === "pending").length || 0,
    avgTicket: 0,
  };
  metrics.avgTicket = metrics.totalSales > 0 ? metrics.totalRevenue / metrics.totalSales : 0;

  // Prepare chart data by aggregating by date
  const chartData = purchases?.reduce((acc, purchase) => {
    if (purchase.status !== "approved") return acc;
    const date = format(new Date(purchase.purchase_date || ""), "dd/MM");
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.revenue += purchase.value || 0;
      existing.sales += 1;
    } else {
      acc.push({ date, revenue: purchase.value || 0, sales: 1 });
    }
    return acc;
  }, [] as { date: string; revenue: number; sales: number }[]).reverse() || [];

  if (productLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Produto não encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar aos Produtos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">{product.name}</h1>
                  <Badge variant="outline" className="text-xs">
                    {productTypeLabels[product.type] || product.type}
                  </Badge>
                  {!product.is_active && (
                    <Badge variant="secondary" className="text-xs">Inativo</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-success mt-1">
                  R$ {Number(product.price).toFixed(2)}
                </p>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-1 max-w-md line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar Produto
          </Button>
        </div>

        {/* Period Selector */}
        <PeriodSelector value={period} onChange={setPeriod} />

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receita Total</p>
                <p className="text-xl font-bold">
                  R$ {metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas</p>
                <p className="text-xl font-bold">{metrics.totalSales}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-xl font-bold">
                  R$ {metrics.avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ofertas Ativas</p>
                <p className="text-xl font-bold">{offers?.filter(o => o.is_active).length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              Receita ao Longo do Tempo
            </h3>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[220px]">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`} />}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--success))"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma venda no período selecionado
              </div>
            )}
          </Card>

          {/* Sales Chart */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Vendas por Dia
            </h3>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[220px]">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhuma venda no período selecionado
              </div>
            )}
          </Card>
        </div>

        {/* Offers Section */}
        {offers && offers.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ofertas do Produto
            </h3>
            <div className="flex flex-wrap gap-2">
              {offers.map((offer) => (
                <Badge key={offer.id} variant={offer.is_active ? "default" : "secondary"} className="text-xs">
                  {offer.offer_name} - R$ {Number(offer.offer_price).toFixed(2)}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Sales History Table */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Histórico de Vendas
          </h3>
          {purchasesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : purchases && purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.slice(0, 20).map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm">
                        {format(new Date(purchase.purchase_date || ""), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {purchase.lead_id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        R$ {Number(purchase.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            purchase.status === "approved"
                              ? "default"
                              : purchase.status === "refunded"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {purchase.status === "approved" ? "Aprovado" : purchase.status === "refunded" ? "Reembolsado" : purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {purchase.payment_method || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {purchases.length > 20 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Exibindo 20 de {purchases.length} registros
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma venda encontrada no período selecionado
            </div>
          )}
        </Card>
      </div>

      {/* Edit Product Dialog */}
      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={product} />
    </DashboardLayout>
  );
};

export default ProductDetails;
