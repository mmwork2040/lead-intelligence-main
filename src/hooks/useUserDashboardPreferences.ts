import { useState, useEffect, useCallback } from "react";

export type ViewMode = "dashboard" | "table" | "cards";

export interface DashboardPreferences {
  viewMode: ViewMode;
  visibleMetricCards: string[];
  tableColumns: string[];
  visibleCharts: string[];
  chartOrder: string[];
  cardOrder: string[];
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  viewMode: "dashboard",
  visibleMetricCards: [
    "conversions",
    "impressions",
    "reach",
    "clicks",
    "spend",
    "cpc",
    "frequency",
    "cpm",
    "costPerConversion",
    "ctr",
    "roas",
  ],
  tableColumns: ["spend", "impressions", "clicks", "ctr", "conversions", "roas"],
  visibleCharts: [
    "reach",
    "spending",
    "gauges",
    "topAds",
    "clicksByCampaign",
    "timeline",
  ],
  chartOrder: [
    "reach",
    "spending",
    "gauges",
    "topAds",
    "clicksByCampaign",
    "timeline",
  ],
  cardOrder: [
    "conversions",
    "impressions",
    "reach",
    "clicks",
    "spend",
    "cpc",
    "frequency",
    "cpm",
    "costPerConversion",
    "ctr",
    "roas",
    "campaigns",
  ],
};

const STORAGE_KEY = "traffic-dashboard-preferences";

export function useUserDashboardPreferences() {
  const [preferences, setPreferencesState] = useState<DashboardPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Error loading preferences:", e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error("Error saving preferences:", e);
    }
  }, [preferences]);

  const setPreferences = useCallback((updates: Partial<DashboardPreferences>) => {
    setPreferencesState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferencesState(DEFAULT_PREFERENCES);
  }, []);

  const toggleMetricCard = useCallback((metricId: string) => {
    setPreferencesState((prev) => {
      const current = prev.visibleMetricCards;
      const updated = current.includes(metricId)
        ? current.filter((id) => id !== metricId)
        : [...current, metricId];
      return { ...prev, visibleMetricCards: updated };
    });
  }, []);

  const toggleTableColumn = useCallback((columnId: string) => {
    setPreferencesState((prev) => {
      const current = prev.tableColumns;
      const updated = current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId];
      return { ...prev, tableColumns: updated };
    });
  }, []);

  const toggleChart = useCallback((chartId: string) => {
    setPreferencesState((prev) => {
      const current = prev.visibleCharts;
      const updated = current.includes(chartId)
        ? current.filter((id) => id !== chartId)
        : [...current, chartId];
      return { ...prev, visibleCharts: updated };
    });
  }, []);

  return {
    preferences,
    setPreferences,
    resetPreferences,
    toggleMetricCard,
    toggleTableColumn,
    toggleChart,
  };
}
