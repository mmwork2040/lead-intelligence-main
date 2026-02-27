import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface FacebookGaugeChartProps {
  title: string;
  value: number;
  maxValue?: number;
  trend?: number;
  suffix?: string;
}

export function FacebookGaugeChart({
  title,
  value,
  maxValue = 100,
  trend,
  suffix = "%",
}: FacebookGaugeChartProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const data = [
    { name: "value", value: percentage },
    { name: "remaining", value: 100 - percentage },
  ];

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold text-center">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-0">
        <div className="relative w-32 h-20 overflow-hidden">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={50}
                outerRadius={70}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="hsl(var(--primary))" />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-2xl font-bold text-foreground">
              {value.toFixed(1)}{suffix}
            </span>
          </div>
        </div>

        {trend !== undefined && (
          <div className="flex items-center justify-center mt-2">
            <span
              className={`text-xs font-medium ${isPositive
                  ? "text-[hsl(var(--chart-green))]"
                  : isNegative
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
            >
              {isPositive && "▲"}
              {isNegative && "▼"}
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}

        <div className="flex justify-between w-full px-4 mt-1">
          <span className="text-xs text-muted-foreground">0%</span>
          <span className="text-xs text-muted-foreground">{maxValue}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
