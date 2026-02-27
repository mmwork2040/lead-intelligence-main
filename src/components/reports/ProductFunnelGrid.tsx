import ProductFunnel from "./ProductFunnel";
import { useProductFunnels } from "@/hooks/useProductFunnels";

const ProductFunnelGrid = () => {
  const { data: funnels, isLoading } = useProductFunnels();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!funnels || funnels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum funil de produto disponível</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {funnels.map((funnel) => (
        <ProductFunnel
          key={funnel.productSlug}
          productName={funnel.productName}
          stages={funnel.stages}
          totalRevenue={funnel.totalRevenue}
          conversionRate={funnel.conversionRate}
        />
      ))}
    </div>
  );
};

export default ProductFunnelGrid;
