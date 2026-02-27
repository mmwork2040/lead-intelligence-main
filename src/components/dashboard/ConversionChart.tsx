import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import EmptyChart from "./EmptyChart";

interface ConversionChartProps {
  data: any[];
}

const COLORS = [
  'hsl(160, 50%, 40%)',   // Green — novo/qualificado
  'hsl(38, 85%, 48%)',    // Amber — engajado/negociando
  'hsl(72, 90%, 42%)',    // Acid dim — lead/comprador
  'hsl(24, 8%, 45%)',     // Stone — default
  'hsl(0, 72%, 55%)',     // Red — perdido
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-1">{data.name || data.stage || label}</p>
        <p className="text-lg font-bold text-foreground">
          {payload[0].value?.toLocaleString('pt-BR')} leads
        </p>
        <p className="text-xs text-muted-foreground">Quantidade no estágio</p>
      </div>
    );
  }
  return null;
};

const ConversionChart = ({ data }: ConversionChartProps) => {
  if (!data || data.length === 0) {
    return <EmptyChart description="Dados de conversão aparecerão quando houver leads e vendas" />;
  }

  // Normalizar dados para suportar ambos os formatos (stage/name, value/conversion)
  const normalizedData = data.map(item => ({
    name: item.name || item.stage || 'Desconhecido',
    value: item.value ?? item.conversion ?? 0,
    fill: item.fill
  }));

  const maxValue = Math.max(...normalizedData.map(d => d.value), 1);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={normalizedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          tickFormatter={(value) => value.toLocaleString('pt-BR')}
          domain={[0, Math.ceil(maxValue * 1.1)]}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
        <Bar 
          dataKey="value" 
          radius={[8, 8, 8, 8]}
          name="Quantidade"
          maxBarSize={60}
        >
          {normalizedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill || COLORS[index % COLORS.length]}
              className="transition-all duration-200 hover:opacity-80"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ConversionChart;
