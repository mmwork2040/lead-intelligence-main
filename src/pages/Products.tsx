import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Users, DollarSign, Package, Pencil, Trash2, Bot, RefreshCw, AlertTriangle, MoreVertical, Eye, Lock } from "lucide-react";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useProductMetrics } from "@/hooks/useProductMetrics";
import { useUnlinkedPurchases, useProcessExistingProducts } from "@/hooks/useProcessExistingProducts";
import { ProductDialog } from "@/components/products/ProductDialog";
import { ProductOffersCount } from "@/components/products/ProductOffersCount";
import { PeriodSelector } from "@/components/dashboard/PeriodSelector";
import { PeriodFilter } from "@/lib/dateUtils";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  metadata?: { auto_created?: boolean; source?: string } | null;
};

const productTypeLabels: Record<string, string> = {
  curso: "Curso",
  mentoria: "Mentoria",
  ebook: "E-book",
  evento: "Evento",
  outro: "Outro",
};

const Products = ({ openDialog }: { openDialog?: boolean } = {}) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (openDialog) {
      setDialogOpen(true);
    }
  }, [openDialog]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [period, setPeriod] = useState<PeriodFilter>({ type: "30d" });
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");

  const { data: products, isLoading } = useProducts();
  const { data: metricsData, isLoading: metricsLoading } = useProductMetrics(period);
  const { data: unlinkedPurchases } = useUnlinkedPurchases();
  const processProducts = useProcessExistingProducts();
  const deleteProduct = useDeleteProduct();
  const { data: userRole, isLoading: roleLoading } = useUserRole();

  const canEdit = userRole === 'admin' || userRole === 'commercial';

  const totalUnlinked = unlinkedPurchases?.reduce((sum, p) => sum + p.count, 0) || 0;

  const handleEdit = (product: Product) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para editar produtos.");
      return;
    }
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (!canEdit) {
      toast.error("Você não tem permissão para excluir produtos.");
      return;
    }
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct.mutateAsync(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleNewProduct = () => {
    if (!canEdit) {
      toast.error("Você não tem permissão para criar produtos.");
      return;
    }
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  // Calculate summary metrics based on filter
  const getFilteredMetrics = () => {
    if (selectedProductFilter === "all" || !metricsData) {
      return {
        totalRevenue: metricsData?.totalRevenue || 0,
        totalSales: metricsData?.totalSales || 0,
      };
    }
    const productMetrics = metricsData?.productMetrics[selectedProductFilter] || { sales: 0, revenue: 0 };
    return {
      totalRevenue: productMetrics.revenue,
      totalSales: productMetrics.sales,
    };
  };

  const totalProducts = products?.filter((p) => p.is_active).length || 0;
  const { totalRevenue, totalSales } = getFilteredMetrics();

  // Helper to get metrics for a specific product
  const getProductMetrics = (productId: string) => {
    return metricsData?.productMetrics[productId] || { sales: 0, revenue: 0 };
  };

  if (isLoading) {
    return <PageSkeleton variant="cards" metrics={4} />;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus produtos e acompanhe o desempenho
            </p>
          </div>
          <div className="flex gap-2">
            {totalUnlinked > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => processProducts.mutate()}
                disabled={processProducts.isPending}
              >
                {processProducts.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Package className="w-3.5 h-3.5" />
                )}
                Processar ({totalUnlinked})
              </Button>
            )}
            {canEdit ? (
              <Button size="sm" className="gap-1.5" onClick={handleNewProduct}>
                <Plus className="w-3.5 h-3.5" />
                Novo Produto
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" className="gap-1.5" disabled>
                    <Lock className="w-3.5 h-3.5" />
                    Novo Produto
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Você não tem permissão para criar produtos</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Period Selector and Product Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <PeriodSelector value={period} onChange={setPeriod} />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Filtrar:</span>
            <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os produtos</SelectItem>
                {products?.filter(p => p.is_active).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alert for unlinked purchases */}
        {totalUnlinked > 0 && (
          <Card className="p-3 border-warning/50 bg-warning/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-xs">
                  {totalUnlinked} compras sem produto vinculado
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {unlinkedPurchases?.slice(0, 4).map((p) => (
                    <Badge key={p.product_name} variant="outline" className="text-[10px] px-1.5 py-0">
                      {p.product_name} ({p.count})
                    </Badge>
                  ))}
                  {(unlinkedPurchases?.length || 0) > 4 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{(unlinkedPurchases?.length || 0) - 4} mais
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Produtos</p>
                <p className="text-lg font-bold">{totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Receita</p>
                <p className="text-lg font-bold">
                  {metricsLoading ? "..." : `R$ ${(totalRevenue / 1000).toFixed(1)}k`}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Vendas</p>
                <p className="text-lg font-bold">
                  {metricsLoading ? "..." : totalSales}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Grid */}
        {!products || products.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-sm font-semibold mb-1">Nenhum produto cadastrado</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Comece criando seu primeiro produto
            </p>
            <Button size="sm" onClick={handleNewProduct} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Criar Produto
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {products.map((product) => {
              const metrics = getProductMetrics(product.id);
              return (
                <Card
                  key={product.id}
                  className="overflow-hidden transition-smooth hover:shadow-custom group"
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5">
                                {productTypeLabels[product.type] || product.type}
                              </Badge>
                              {!product.is_active && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted">
                                  Inativo
                                </Badge>
                              )}
                              {(product.metadata as any)?.auto_created && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary/5 gap-0.5">
                                  <Bot className="w-2.5 h-2.5" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => navigate(`/products/${product.slug}`)}>
                                <Eye className="h-3 w-3 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(product)}
                                disabled={!canEdit}
                              >
                                <Pencil className="h-3 w-3 mr-2" />
                                Editar
                                {!canEdit && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(product)}
                                className="text-destructive focus:text-destructive"
                                disabled={!canEdit}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Excluir
                                {!canEdit && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Price */}
                        <p className="text-base font-bold text-success mt-2">
                          R$ {Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <div className="flex-1 text-center">
                        <p className="text-[10px] text-muted-foreground">Vendas</p>
                        <p className="text-sm font-semibold">
                          {metricsLoading ? "..." : metrics.sales}
                        </p>
                      </div>
                      <div className="flex-1 text-center border-l border-border">
                        <p className="text-[10px] text-muted-foreground">Receita</p>
                        <p className="text-sm font-semibold">
                          {metricsLoading ? "..." : `R$ ${metrics.revenue.toLocaleString("pt-BR")}`}
                        </p>
                      </div>
                      <div className="flex-1 text-center border-l border-border">
                        <p className="text-[10px] text-muted-foreground">Ofertas</p>
                        <ProductOffersCount productId={product.id} compact />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Dialog */}
      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={selectedProduct} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não
              pode ser desfeita.
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

export default Products;
