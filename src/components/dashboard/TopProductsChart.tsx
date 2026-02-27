import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import EmptyChart from "./EmptyChart";

interface TopProductsChartProps {
  data: any[];
}

const COLORS = [
  'hsl(var(--chart-1))', // Primary dominant
  'hsl(var(--chart-2))', // Secondary highlight
  'hsl(var(--chart-3))', // Amber/warning
  'hsl(var(--chart-4))', // Red/destructive
  'hsl(var(--chart-5))', // Neutral
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">{payload[0].payload.name}</p>
        <p className="text-lg font-bold text-foreground">
          {payload[0].value?.toLocaleString('pt-BR')} vendas
        </p>
      </div>
    );
  }
  return null;
};

const TopProductsChart = ({ data }: TopProductsChartProps) => {
  if (!data || data.length === 0) {
    return <EmptyChart description="Cadastre produtos e registre vendas para ver o ranking" />;
  }

  const displayData = data.slice(0, 5);
  const hasMore = data.length > 5;

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            horizontal={false}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
          <Bar
            dataKey="sales"
            radius={[0, 8, 8, 0]}
            name="Vendas"
            maxBarSize={40}
          >
            {displayData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-200 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {hasMore && (
        <p className="text-xs text-muted-foreground text-center">
          Mostrando top 5 de {data.length} produtos
        </p>
      )}
    </div>
  );
};

export default TopProductsChart;
