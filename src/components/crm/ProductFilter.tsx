import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductFilterProps {
  selectedProduct: string | null;
  onProductChange: (productSlug: string | null) => void;
}

export const ProductFilter = ({ selectedProduct, onProductChange }: ProductFilterProps) => {
  const { data: products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Filtrar por produto:</h3>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    );
  }

  const activeProducts = products?.filter(p => p.is_active) || [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Filtrar por produto:</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedProduct === null ? "default" : "outline"}
          size="sm"
          onClick={() => onProductChange(null)}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Todos os Produtos
        </Button>

        {activeProducts.map((product) => (
          <Button
            key={product.id}
            variant={selectedProduct === product.slug ? "default" : "outline"}
            size="sm"
            onClick={() => onProductChange(product.slug)}
          >
            {product.name}
          </Button>
        ))}
      </div>
    </div>
  );
};
