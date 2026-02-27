import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import EmptyChart from "./EmptyChart";

interface RevenueChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--chart-green))]" />
          <span className="text-sm font-bold text-foreground">
            R$ {payload[0].value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data }: RevenueChartProps) => {
  if (!data || data.length === 0) {
    return <EmptyChart description="Registre vendas para visualizar a evolução da receita" />;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-green))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-green))"
          fill="url(#colorRevenue)"
          name="Receita"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--chart-green))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
