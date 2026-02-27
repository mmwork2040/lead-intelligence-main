import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FunnelStage {
  label: string;
  count: number;
  percentage?: number;
  color: string;
}

interface ProductFunnelProps {
  productName: string;
  stages: FunnelStage[];
  totalRevenue: number;
  conversionRate: string;
}

const ProductFunnel = ({ productName, stages, totalRevenue, conversionRate }: ProductFunnelProps) => {
  const maxCount = stages[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📦 {productName}</span>
          <Badge variant="default">{conversionRate}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.label}</span>
                <span className="text-muted-foreground">
                  {stage.count}
                  {stage.percentage && (
                    <span className="ml-1 text-xs">({stage.percentage.toFixed(1)}%)</span>
                  )}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                <div
                  className="h-full flex items-center justify-center text-xs font-medium text-white transition-all duration-300"
                  style={{
                    width: `${widthPercentage}%`,
                    backgroundColor: stage.color,
                    minWidth: stage.count > 0 ? '30px' : '0px'
                  }}
                >
                  {stage.count > 0 && stage.count}
                </div>
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 mt-4 border-t flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Conversão Geral</p>
            <p className="text-lg font-bold">{conversionRate}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-primary">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductFunnel;
