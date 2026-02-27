import { useProductOffers } from "@/hooks/useProductOffers";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Package } from "lucide-react";

interface ProductOffersCountProps {
  productId: string;
  compact?: boolean;
}

export function ProductOffersCount({ productId, compact = false }: ProductOffersCountProps) {
  const { data: offers = [], isLoading } = useProductOffers(productId);

  if (isLoading) {
    if (compact) {
      return <span className="text-sm font-semibold text-muted-foreground">...</span>;
    }
    return (
      <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
        <Package className="w-3 h-3 mr-1" />
        Carregando...
      </Badge>
    );
  }

  if (compact) {
    return <span className="text-sm font-semibold">{offers.length}</span>;
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20 cursor-help">
            <Package className="w-3 h-3 mr-1" />
            {offers.length} {offers.length === 1 ? "oferta" : "ofertas"} Hotmart
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold mb-2">Ofertas da Hotmart:</p>
            {offers.map((offer) => (
              <div key={offer.id} className="text-xs">
                <span className="font-mono font-medium">{offer.hotmart_code}</span> - {offer.offer_name}
                {!offer.is_active && <span className="text-muted-foreground ml-1">(Inativa)</span>}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
