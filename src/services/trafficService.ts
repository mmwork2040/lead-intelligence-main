import {
  adAccountSummary,
  reachHistory,
  campaignPerformance,
  adPerformance,
  mockHierarchicalData,
  type AdAccountSummary,
  type ReachHistoryItem,
  type CampaignPerformanceItem,
  type AdPerformanceItem,
  type MockHierarchicalReportData,
} from './mocks/mockFacebookAds';

const MOCK_DELAY = 800; // Simulates API latency

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface TrafficFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  campaignId?: string;
  status?: string;
}

export const trafficService = {
  /**
   * Fetch account summary metrics with variations
   */
  async getAccountSummary(): Promise<AdAccountSummary> {
    await delay(MOCK_DELAY);
    return adAccountSummary;
  },

  /**
   * Fetch reach history for timeline charts
   */
  async getReachHistory(filters?: TrafficFilters): Promise<ReachHistoryItem[]> {
    await delay(MOCK_DELAY);
    
    if (filters?.period) {
      const days = parseInt(filters.period.replace('d', '')) || 30;
      return reachHistory.slice(-days);
    }
    
    return reachHistory;
  },

  /**
   * Fetch campaign performance data
   */
  async getCampaignPerformance(filters?: TrafficFilters): Promise<CampaignPerformanceItem[]> {
    await delay(MOCK_DELAY);
    return campaignPerformance;
  },

  /**
   * Fetch individual ad performance data
   */
  async getAdPerformance(filters?: TrafficFilters): Promise<AdPerformanceItem[]> {
    await delay(MOCK_DELAY);
    return adPerformance;
  },

  /**
   * Fetch complete hierarchical data (campaigns > adsets > ads)
   */
  async getHierarchicalData(filters?: TrafficFilters): Promise<MockHierarchicalReportData> {
    await delay(MOCK_DELAY);
    
    let data = { ...mockHierarchicalData };
    
    // Filter by campaign if specified
    if (filters?.campaignId) {
      data.campaigns = data.campaigns.filter(c => c.id === filters.campaignId);
    }
    
    // Filter by status if specified
    if (filters?.status) {
      data.campaigns = data.campaigns.filter(c => c.status === filters.status);
    }
    
    return data;
  },

  /**
   * Check if mock data is being used (for UI indicators)
   */
  isMockData(): boolean {
    return true;
  },
};

export type { 
  AdAccountSummary, 
  ReachHistoryItem, 
  CampaignPerformanceItem, 
  AdPerformanceItem,
  MockHierarchicalReportData,
};
