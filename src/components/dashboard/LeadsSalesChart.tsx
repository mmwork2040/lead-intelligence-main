import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import EmptyChart from "./EmptyChart";

interface LeadsSalesChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-foreground">
              {entry.name}: {entry.value?.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const LeadsSalesChart = ({ data }: LeadsSalesChartProps) => {
  if (!data || data.length === 0) {
    return <EmptyChart description="Capture leads e registre vendas para visualizar o gráfico" />;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => (
            <span className="text-sm text-muted-foreground font-medium">{value}</span>
          )}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="hsl(var(--primary))"
          fill="url(#colorLeads)"
          name="Leads"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
        />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="hsl(var(--chart-green))"
          fill="url(#colorSales)"
          name="Vendas"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LeadsSalesChart;
