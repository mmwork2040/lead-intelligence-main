import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UnifiedReportMetrics } from "@/hooks/useUnifiedReportMetrics";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ArrowUpDown, Megaphone, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ReportTabCampaignsProps {
  metrics: UnifiedReportMetrics;
}

type SortKey = "roas" | "revenue" | "investment" | "leads" | "sales";

export const ReportTabCampaigns = ({ metrics }: ReportTabCampaignsProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("roas");
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

  const sortedCampaigns = [...metrics.campaignMetrics].sort((a, b) => {
    let valA: number, valB: number;
    
    switch (sortKey) {
      case "roas":
        valA = parseFloat(a.roas);
        valB = parseFloat(b.roas);
        break;
      case "revenue":
        valA = a.revenue;
        valB = b.revenue;
        break;
      case "investment":
        valA = a.investment;
        valB = b.investment;
        break;
      case "leads":
        valA = a.leads;
        valB = b.leads;
        break;
      case "sales":
        valA = a.sales;
        valB = b.sales;
        break;
      default:
        valA = parseFloat(a.roas);
        valB = parseFloat(b.roas);
    }
    
    return sortAsc ? valA - valB : valB - valA;
  });

  const chartData = metrics.campaignMetrics.slice(0, 8).map(c => ({
    name: c.campaignName.length > 15 ? c.campaignName.substring(0, 15) + "..." : c.campaignName,
    investimento: c.investment,
    receita: c.revenue
  }));

  const totalInvestment = metrics.campaignMetrics.reduce((sum, c) => sum + c.investment, 0);
  const totalCampaignRevenue = metrics.campaignMetrics.reduce((sum, c) => sum + c.revenue, 0);
  const avgROAS = totalInvestment > 0 ? (totalCampaignRevenue / totalInvestment) : 0;

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
      {/* Resumo de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Megaphone className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{metrics.campaignMetrics.length}</div>
              <div className="text-sm text-muted-foreground">Campanhas ativas</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalInvestment)}</div>
              <div className="text-sm text-muted-foreground">Total investido</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(totalCampaignRevenue)}</div>
              <div className="text-sm text-muted-foreground">Receita gerada</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={avgROAS >= 1 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                {avgROAS >= 1 ? (
                  <TrendingUp className="h-5 w-5 text-primary" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <span className={`text-2xl font-bold ${avgROAS >= 1 ? "text-primary" : "text-destructive"}`}>
                  {avgROAS.toFixed(2)}x
                </span>
              </div>
              <div className="text-sm text-muted-foreground">ROAS médio</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Investimento vs Receita */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Investimento vs Receita</CardTitle>
          <Link to="/reports">
            <Button variant="outline" size="sm">
              Ver Facebook Ads
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--popover))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Bar dataKey="investimento" fill="hsl(var(--muted-foreground))" name="Investimento" />
                <Bar dataKey="receita" fill="hsl(var(--primary))" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sem dados para o período
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas as Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="leads" label="Leads" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="sales" label="Vendas" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="investment" label="Investimento" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="revenue" label="Receita" />
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton keyName="roas" label="ROAS" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map((campaign) => {
                    const roasValue = parseFloat(campaign.roas);
                    return (
                      <TableRow key={campaign.campaignId}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{campaign.campaignName}</div>
                            <div className="text-xs text-muted-foreground">{campaign.campaignSlug}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{campaign.leads}</TableCell>
                        <TableCell className="text-right">{campaign.sales}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(campaign.investment)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(campaign.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={roasValue >= 2 ? "default" : roasValue >= 1 ? "secondary" : "destructive"}
                          >
                            {campaign.roas}x
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma campanha com dados no período selecionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
