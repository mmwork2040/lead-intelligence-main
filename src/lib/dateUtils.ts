import { startOfDay, endOfDay, subDays, subMonths, subYears, subHours } from "date-fns";

export type PeriodType = "today" | "24h" | "3d" | "7d" | "15d" | "30d" | "3m" | "6m" | "1y" | "custom" | "all";

export interface PeriodFilter {
  type: PeriodType;
  startDate?: Date;
  endDate?: Date;
}

export const calculateDateRange = (period: PeriodFilter): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = endOfDay(now);
  
  switch (period.type) {
    case "today":
      return { startDate: startOfDay(now), endDate };
    case "24h":
      return { startDate: subHours(now, 24), endDate: now };
    case "3d":
      return { startDate: startOfDay(subDays(now, 3)), endDate };
    case "7d":
      return { startDate: startOfDay(subDays(now, 7)), endDate };
    case "15d":
      return { startDate: startOfDay(subDays(now, 15)), endDate };
    case "30d":
      return { startDate: startOfDay(subDays(now, 30)), endDate };
    case "3m":
      return { startDate: startOfDay(subMonths(now, 3)), endDate };
    case "6m":
      return { startDate: startOfDay(subMonths(now, 6)), endDate };
    case "1y":
      return { startDate: startOfDay(subYears(now, 1)), endDate };
    case "custom":
      return {
        startDate: period.startDate ? startOfDay(period.startDate) : startOfDay(subDays(now, 30)),
        endDate: period.endDate ? endOfDay(period.endDate) : endDate,
      };
    case "all":
      return { startDate: new Date("2020-01-01"), endDate };
    default:
      return { startDate: startOfDay(subDays(now, 30)), endDate };
  }
};

export const getDateRange = (period: PeriodFilter): { startDate: Date | null; endDate: Date | null } => {
  if (period.type === "all") {
    return { startDate: null, endDate: null };
  }
  const range = calculateDateRange(period);
  return { startDate: range.startDate, endDate: range.endDate };
};

export const getPeriodLabel = (period: PeriodFilter): string => {
  const labels: Record<PeriodType, string> = {
    today: "Hoje",
    "24h": "Últimas 24h",
    "3d": "Últimos 3 dias",
    "7d": "7 dias",
    "15d": "15 dias",
    "30d": "30 dias",
    "3m": "3 meses",
    "6m": "6 meses",
    "1y": "1 ano",
    custom: "Personalizado",
    all: "Todo período",
  };
  return labels[period.type] || "30 dias";
};
