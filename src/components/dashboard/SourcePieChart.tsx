import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import EmptyChart from "./EmptyChart";

interface SourcePieChartProps {
  data: any[];
}

const COLORS = [
  'hsl(var(--chart-1))', // Primary dominant
  'hsl(var(--chart-2))', // Secondary highlight
  'hsl(var(--chart-3))', // Amber/warning
  'hsl(var(--chart-4))', // Red/destructive
  'hsl(var(--chart-5))', // Neutral
  'hsl(var(--chart-green))', // Success
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="text-sm font-medium text-foreground">{data.name}</span>
        </div>
        <p className="text-lg font-bold text-foreground pl-5">
          {data.value?.toLocaleString('pt-BR')} leads
        </p>
        <p className="text-xs text-muted-foreground pl-5">
          {((data.payload.percent || 0) * 100).toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-semibold"
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SourcePieChart = ({ data }: SourcePieChartProps) => {
  if (!data || data.length === 0) {
    return <EmptyChart description="Capture leads de diferentes origens para visualizar a distribuição" />;
  }

  // Limitar a 5 origens + "outros"
  let displayData = data;
  if (data.length > 5) {
    const top5 = data.slice(0, 5);
    const othersLeads = data.slice(5).reduce((sum, item) => sum + (item.leads || item.value || 0), 0);
    displayData = [...top5, { name: "Outros", leads: othersLeads }];
  }

  const total = displayData.reduce((sum, item) => sum + (item.leads || item.value || 0), 0);
  const dataWithPercent = displayData.map(item => ({
    ...item,
    leads: item.leads || item.value || 0,
    percent: (item.leads || item.value || 0) / total
  }));

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={dataWithPercent}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={110}
            innerRadius={55}
            fill="hsl(var(--primary))"
            dataKey="leads"
            paddingAngle={3}
            strokeWidth={0}
          >
            {dataWithPercent.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-200 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap lg:flex-col gap-2 justify-center lg:min-w-[140px]">
        {dataWithPercent.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SourcePieChart;
