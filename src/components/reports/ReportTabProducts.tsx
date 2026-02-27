import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UnifiedReportMetrics, ProductMetric } from "@/hooks/useUnifiedReportMetrics";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ArrowUpDown, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReportTabProductsProps {
  metrics: UnifiedReportMetrics;
}

type SortKey = "revenue" | "sales" | "conversionRate" | "leads";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))"
];

export const ReportTabProducts = ({ metrics }: ReportTabProductsProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const formatCurrency = (value: number) => 
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedProducts = [...metrics.productMetrics].sort((a, b) => {
    let valA: number, valB: number;
    
    switch (sortKey) {
      case "revenue":
        valA = a.revenue;
        valB = b.revenue;
        break;
      case "sales":
        valA = a.sales;
        valB = b.sales;
        break;
      case "conversionRate":
        valA = parseFloat(a.conversionRate);
        valB = parseFloat(b.conversionRate);
        break;
      case "leads":
        valA = a.leads;
        valB = b.leads;
        break;
      default:
        valA = a.revenue;
        valB = b.revenue;
    }
    
    return sortAsc ? valA - valB : valB - valA;
  });

  const pieData = metrics.productMetrics.slice(0, 5).map((p, i) => ({
    name: p.productName,
    value: p.revenue,
    color: COLORS[i % COLORS.length]
  }));

  const otherRevenue = metrics.productMetrics.slice(5).reduce((sum, p) => sum + p.revenue, 0);
  if (otherRevenue > 0) {
    pieData.push({
      name: "Outros",
      value: otherRevenue,
      color: COLORS[5]
    });
  }

  const SortButton = ({ keyName, label }: { keyName: SortKey; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(keyName)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Resumo e Gráfico de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{metrics.productMetrics.length}</div>
                  <div className="text-sm text-muted-foreground">Produtos ativos</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{metrics.totalSales}</div>
                  <div className="text-sm text-muted-foreground">Vendas totais</div>
                </div>
              </div>
              
              {metrics.productMetrics.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-sm text-muted-foreground mb-1">Produto mais vendido</div>
                  <div className="font-semibold">{metrics.productMetrics[0]?.productName}</div>
                  <div className="text-sm text-primary">
                    {formatCurrency(metrics.productMetrics[0]?.revenue || 0)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para o período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos os Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="leads" label="Leads" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="sales" label="Vendas" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="revenue" label="Receita" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="conversionRate" label="Conversão" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.productName}
                          {product.sales > 0 && parseFloat(product.conversionRate) >= 5 && (
                            <Badge variant="secondary" className="text-xs">Top</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{product.leads}</TableCell>
                      <TableCell className="text-right">{product.sales}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(product.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={parseFloat(product.conversionRate) >= 3 ? "default" : "outline"}
                        >
                          {product.conversionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum produto com dados no período selecionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
