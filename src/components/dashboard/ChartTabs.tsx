import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TrendingUp, DollarSign, PieChart, Target, Package } from "lucide-react";
import LeadsSalesChart from "./LeadsSalesChart";
import RevenueChart from "./RevenueChart";
import SourcePieChart from "./SourcePieChart";
import ConversionChart from "./ConversionChart";
import TopProductsChart from "./TopProductsChart";

interface ChartTabsProps {
  chartData: any[];
  revenueData?: any[];
  sourceData?: any[];
  conversionData?: any[];
  topProductsData?: any[];
}

const ChartTabs = ({ 
  chartData, 
  revenueData = [], 
  sourceData = [], 
  conversionData = [],
  topProductsData = []
}: ChartTabsProps) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Análise de Desempenho</CardTitle>
        <CardDescription>Visualização detalhada dos seus indicadores</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leads-sales" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="leads-sales" 
                className="flex-shrink-0 gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Leads/Vendas</span>
                <span className="sm:hidden">L/V</span>
              </TabsTrigger>
              <TabsTrigger 
                value="revenue" 
                className="flex-shrink-0 gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Receita</span>
                <span className="sm:hidden">R$</span>
              </TabsTrigger>
              <TabsTrigger 
                value="source" 
                className="flex-shrink-0 gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Origem</span>
                <span className="sm:hidden">Orig</span>
              </TabsTrigger>
              <TabsTrigger 
                value="conversion" 
                className="flex-shrink-0 gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Conversão</span>
                <span className="sm:hidden">Conv</span>
              </TabsTrigger>
              <TabsTrigger 
                value="top-products" 
                className="flex-shrink-0 gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Top 5</span>
                <span className="sm:hidden">Top</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="sm:hidden" />
          </ScrollArea>
          
          <TabsContent value="leads-sales" className="mt-6">
            <LeadsSalesChart data={chartData} />
          </TabsContent>
          
          <TabsContent value="revenue" className="mt-6">
            <RevenueChart data={revenueData} />
          </TabsContent>
          
          <TabsContent value="source" className="mt-6">
            <SourcePieChart data={sourceData} />
          </TabsContent>
          
          <TabsContent value="conversion" className="mt-6">
            <ConversionChart data={conversionData} />
          </TabsContent>
          
          <TabsContent value="top-products" className="mt-6">
            <TopProductsChart data={topProductsData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ChartTabs;
