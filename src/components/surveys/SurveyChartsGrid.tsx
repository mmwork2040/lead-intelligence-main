import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface SurveyChartsGridProps {
  responses: any[];
  questions: string[];
}

export function SurveyChartsGrid({ responses, questions }: SurveyChartsGridProps) {
  const chartData = useMemo(() => {
    return questions.map((question) => {
      const answerCounts: Record<string, number> = {};
      
      responses.forEach((response) => {
        const answers = response.answers as Record<string, any>;
        const answer = answers[question];
        if (answer !== undefined && answer !== null && answer !== "") {
          const answerStr = String(answer).trim();
          answerCounts[answerStr] = (answerCounts[answerStr] || 0) + 1;
        }
      });

      const total = Object.values(answerCounts).reduce((a, b) => a + b, 0);
      
      const data = Object.entries(answerCounts)
        .map(([answer, count]) => ({
          answer: answer.length > 30 ? answer.substring(0, 30) + "..." : answer,
          fullAnswer: answer,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 respostas

      return {
        question,
        data,
        total,
      };
    });
  }, [responses, questions]);

  const getBarColor = (index: number, total: number) => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--chart-green))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-1))",
      "hsl(var(--chart-5))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-2))",
      "hsl(var(--muted-foreground))",
    ];
    return colors[index % colors.length];
  };

  if (questions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhuma pergunta encontrada nas respostas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {chartData.map(({ question, data, total }, questionIndex) => (
        <Card key={questionIndex} className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium leading-tight">
              {question}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {total} respostas
            </p>
          </CardHeader>
          <CardContent>
            {data.length > 0 ? (
              <ChartContainer
                config={{
                  count: { label: "Respostas", color: "hsl(var(--primary))" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="answer"
                      width={120}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-md">
                              <p className="text-xs font-medium">{data.fullAnswer}</p>
                              <p className="text-xs text-muted-foreground">
                                {data.count} respostas ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(index, data.length)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Sem dados para esta pergunta
              </div>
            )}
            {data.length > 0 && (
              <div className="mt-3 space-y-1">
                {data.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground" title={item.fullAnswer}>
                      {item.answer}
                    </span>
                    <span className="ml-2 font-medium text-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
