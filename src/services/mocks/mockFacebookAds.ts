// Mock data for Facebook Ads Traffic Module
// Based on realistic ad account metrics

export interface MetricWithVariation {
  value: number;
  variation: number;
}

export interface AdAccountSummary {
  totalActions: MetricWithVariation;
  impressions: MetricWithVariation;
  reach: MetricWithVariation;
  clicks: MetricWithVariation;
  spending: MetricWithVariation;
  cpc: MetricWithVariation;
  frequency: MetricWithVariation;
  socialSpending: MetricWithVariation;
  conversions: MetricWithVariation;
  roas: MetricWithVariation;
  cpm: MetricWithVariation;
  ctr: MetricWithVariation;
}

export interface ReachHistoryItem {
  date: string;
  reach: number;
  social_reach: number;
  impressions: number;
}

export interface CampaignPerformanceItem {
  name: string;
  spend: number;
  conversions: number;
  clicks: number;
  impressions: number;
  cpm: number;
  cpc: number;
  ctr: number;
  roas: number;
}

export interface AdPerformanceItem {
  ad_name: string;
  campaign_name: string;
  spend: number;
  conversion_rate: number;
  clicks: number;
  impressions: number;
  cpc: number;
  ctr: number;
}

// Account Summary with variations
export const adAccountSummary: AdAccountSummary = {
  totalActions: { value: 1748, variation: -17.0 },
  impressions: { value: 2600000, variation: 8.5 },
  reach: { value: 46000, variation: -12.3 },
  clicks: { value: 21000, variation: 5.2 },
  spending: { value: 22500, variation: -4.8 },
  cpc: { value: 1.06, variation: -8.2 },
  frequency: { value: 56.43, variation: 15.3 },
  socialSpending: { value: 18800, variation: -22.1 },
  conversions: { value: 892, variation: 12.7 },
  roas: { value: 3.4, variation: 18.5 },
  cpm: { value: 8.65, variation: -3.2 },
  ctr: { value: 0.81, variation: 2.1 },
};

// Generate 30 days of reach history
const generateReachHistory = (): ReachHistoryItem[] => {
  const data: ReachHistoryItem[] = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    
    // Create realistic fluctuations
    const baseReach = 1200 + Math.sin(i * 0.5) * 400;
    const weekendFactor = [0, 6].includes(date.getDay()) ? 0.7 : 1;
    
    const reach = Math.round(baseReach * weekendFactor + Math.random() * 300);
    const social_reach = Math.round(reach * (0.6 + Math.random() * 0.2));
    const impressions = Math.round(reach * (40 + Math.random() * 20));

    data.push({
      date: date.toISOString().split('T')[0],
      reach,
      social_reach,
      impressions,
    });
  }

  return data;
};

export const reachHistory: ReachHistoryItem[] = generateReachHistory();

// Campaign Performance (Top 10)
export const campaignPerformance: CampaignPerformanceItem[] = [
  { name: 'C5 - Remarketing Quentes', spend: 2800, conversions: 45, clicks: 1890, impressions: 185000, cpm: 15.14, cpc: 1.48, ctr: 1.02, roas: 4.2 },
  { name: 'C16 - Awareness Frio', spend: 2000, conversions: 12, clicks: 2450, impressions: 320000, cpm: 6.25, cpc: 0.82, ctr: 0.77, roas: 1.8 },
  { name: 'C3 - Lead Gen Principal', spend: 1800, conversions: 38, clicks: 1650, impressions: 142000, cpm: 12.68, cpc: 1.09, ctr: 1.16, roas: 3.9 },
  { name: 'C12 - Retargeting Carrinho', spend: 1650, conversions: 52, clicks: 980, impressions: 95000, cpm: 17.37, cpc: 1.68, ctr: 1.03, roas: 5.8 },
  { name: 'C8 - Lookalike Compradores', spend: 1500, conversions: 28, clicks: 1420, impressions: 165000, cpm: 9.09, cpc: 1.06, ctr: 0.86, roas: 3.2 },
  { name: 'C21 - Promoção Black', spend: 1400, conversions: 35, clicks: 1780, impressions: 198000, cpm: 7.07, cpc: 0.79, ctr: 0.90, roas: 4.5 },
  { name: 'C7 - Engajamento Stories', spend: 1200, conversions: 18, clicks: 2100, impressions: 280000, cpm: 4.29, cpc: 0.57, ctr: 0.75, roas: 2.4 },
  { name: 'C15 - Conversão Direta', spend: 1100, conversions: 42, clicks: 890, impressions: 78000, cpm: 14.10, cpc: 1.24, ctr: 1.14, roas: 6.2 },
  { name: 'C2 - Tráfego Blog', spend: 950, conversions: 8, clicks: 2800, impressions: 420000, cpm: 2.26, cpc: 0.34, ctr: 0.67, roas: 1.2 },
  { name: 'C19 - Vídeo Views', spend: 800, conversions: 15, clicks: 1560, impressions: 245000, cpm: 3.27, cpc: 0.51, ctr: 0.64, roas: 2.8 },
];

// Ad Performance (Top 10)
export const adPerformance: AdPerformanceItem[] = [
  { ad_name: 'Big_Savings_Video', campaign_name: 'C5 - Remarketing Quentes', spend: 1400, conversion_rate: 29.9, clicks: 2800, impressions: 145000, cpc: 0.50, ctr: 1.93 },
  { ad_name: 'New_Arrivals_Carousel', campaign_name: 'C3 - Lead Gen Principal', spend: 1200, conversion_rate: 24.5, clicks: 2100, impressions: 128000, cpc: 0.57, ctr: 1.64 },
  { ad_name: 'Flash_Sale_Static', campaign_name: 'C21 - Promoção Black', spend: 980, conversion_rate: 31.2, clicks: 1650, impressions: 89000, cpc: 0.59, ctr: 1.85 },
  { ad_name: 'Testimonial_UGC', campaign_name: 'C12 - Retargeting Carrinho', spend: 920, conversion_rate: 35.8, clicks: 890, impressions: 52000, cpc: 1.03, ctr: 1.71 },
  { ad_name: 'Product_Demo_Reels', campaign_name: 'C8 - Lookalike Compradores', spend: 850, conversion_rate: 22.1, clicks: 1420, impressions: 98000, cpc: 0.60, ctr: 1.45 },
  { ad_name: 'Before_After_Story', campaign_name: 'C15 - Conversão Direta', spend: 780, conversion_rate: 38.4, clicks: 680, impressions: 42000, cpc: 1.15, ctr: 1.62 },
  { ad_name: 'Limited_Offer_Banner', campaign_name: 'C16 - Awareness Frio', spend: 720, conversion_rate: 18.2, clicks: 1890, impressions: 156000, cpc: 0.38, ctr: 1.21 },
  { ad_name: 'Influencer_Collab', campaign_name: 'C7 - Engajamento Stories', spend: 680, conversion_rate: 21.5, clicks: 1560, impressions: 134000, cpc: 0.44, ctr: 1.16 },
  { ad_name: 'FAQ_Carousel', campaign_name: 'C2 - Tráfego Blog', spend: 620, conversion_rate: 15.3, clicks: 2200, impressions: 189000, cpc: 0.28, ctr: 1.16 },
  { ad_name: 'Countdown_Timer', campaign_name: 'C19 - Vídeo Views', spend: 580, conversion_rate: 26.7, clicks: 980, impressions: 72000, cpc: 0.59, ctr: 1.36 },
];

// Hierarchical Data (Campaigns > Adsets > Ads)
export interface MockFacebookMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  conversions: number;
  cpm: number;
  cpc: number;
  ctr: number;
  roas: number;
  frequency: number;
  costPerConversion: number;
}

export interface MockFacebookAd {
  id: string;
  fb_ad_id: string;
  name: string;
  status: string;
  metrics: MockFacebookMetrics;
}

export interface MockFacebookAdset {
  id: string;
  fb_adset_id: string;
  name: string;
  status: string;
  daily_budget: number | null;
  optimization_goal: string;
  metrics: MockFacebookMetrics;
  ads: MockFacebookAd[];
}

export interface MockFacebookCampaign {
  id: string;
  fb_campaign_id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget: number | null;
  metrics: MockFacebookMetrics;
  adsets: MockFacebookAdset[];
}

export interface MockHierarchicalReportData {
  campaigns: MockFacebookCampaign[];
  totals: MockFacebookMetrics;
  lastUpdated: string;
}

const createMetrics = (base: Partial<MockFacebookMetrics>): MockFacebookMetrics => ({
  impressions: base.impressions || 0,
  clicks: base.clicks || 0,
  spend: base.spend || 0,
  reach: base.reach || 0,
  conversions: base.conversions || 0,
  cpm: base.cpm || (base.impressions ? (base.spend! / base.impressions) * 1000 : 0),
  cpc: base.cpc || (base.clicks ? base.spend! / base.clicks : 0),
  ctr: base.ctr || (base.impressions ? (base.clicks! / base.impressions) * 100 : 0),
  roas: base.roas || 0,
  frequency: base.frequency || 1,
  costPerConversion: base.conversions ? base.spend! / base.conversions : 0,
});

export const mockHierarchicalData: MockHierarchicalReportData = {
  campaigns: [
    {
      id: 'camp-1',
      fb_campaign_id: '23851234567890',
      name: 'Remarketing - Visitantes Site',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      daily_budget: 150,
      metrics: createMetrics({ impressions: 185000, clicks: 1890, spend: 2800, reach: 12500, conversions: 45, roas: 4.2, frequency: 14.8 }),
      adsets: [
        {
          id: 'adset-1-1',
          fb_adset_id: '23851234567891',
          name: 'Visitantes 7 dias',
          status: 'ACTIVE',
          daily_budget: 80,
          optimization_goal: 'PURCHASE',
          metrics: createMetrics({ impressions: 95000, clicks: 980, spend: 1450, reach: 6200, conversions: 28, roas: 4.8, frequency: 15.3 }),
          ads: [
            {
              id: 'ad-1-1-1',
              fb_ad_id: '23851234567892',
              name: 'Video Depoimento Cliente',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 52000, clicks: 540, spend: 820, reach: 3400, conversions: 18, roas: 5.2, frequency: 15.3 }),
            },
            {
              id: 'ad-1-1-2',
              fb_ad_id: '23851234567893',
              name: 'Carousel Produtos Top',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 43000, clicks: 440, spend: 630, reach: 2800, conversions: 10, roas: 4.1, frequency: 15.4 }),
            },
          ],
        },
        {
          id: 'adset-1-2',
          fb_adset_id: '23851234567894',
          name: 'Visitantes 30 dias',
          status: 'ACTIVE',
          daily_budget: 70,
          optimization_goal: 'PURCHASE',
          metrics: createMetrics({ impressions: 90000, clicks: 910, spend: 1350, reach: 6300, conversions: 17, roas: 3.5, frequency: 14.3 }),
          ads: [
            {
              id: 'ad-1-2-1',
              fb_ad_id: '23851234567895',
              name: 'Oferta Especial Banner',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 48000, clicks: 490, spend: 720, reach: 3400, conversions: 10, roas: 3.8, frequency: 14.1 }),
            },
            {
              id: 'ad-1-2-2',
              fb_ad_id: '23851234567896',
              name: 'Countdown Timer Story',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 42000, clicks: 420, spend: 630, reach: 2900, conversions: 7, roas: 3.1, frequency: 14.5 }),
            },
          ],
        },
      ],
    },
    {
      id: 'camp-2',
      fb_campaign_id: '23851234567900',
      name: 'Lead Generation - Ebook',
      status: 'ACTIVE',
      objective: 'LEAD_GENERATION',
      daily_budget: 120,
      metrics: createMetrics({ impressions: 142000, clicks: 1650, spend: 1800, reach: 28500, conversions: 38, roas: 3.9, frequency: 4.98 }),
      adsets: [
        {
          id: 'adset-2-1',
          fb_adset_id: '23851234567901',
          name: 'Interesse - Marketing Digital',
          status: 'ACTIVE',
          daily_budget: 60,
          optimization_goal: 'LEAD',
          metrics: createMetrics({ impressions: 78000, clicks: 920, spend: 980, reach: 15600, conversions: 22, roas: 4.2, frequency: 5.0 }),
          ads: [
            {
              id: 'ad-2-1-1',
              fb_ad_id: '23851234567902',
              name: 'Ebook Preview Carousel',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 42000, clicks: 520, spend: 540, reach: 8400, conversions: 14, roas: 4.5, frequency: 5.0 }),
            },
            {
              id: 'ad-2-1-2',
              fb_ad_id: '23851234567903',
              name: 'Lead Magnet Video',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 36000, clicks: 400, spend: 440, reach: 7200, conversions: 8, roas: 3.8, frequency: 5.0 }),
            },
          ],
        },
        {
          id: 'adset-2-2',
          fb_adset_id: '23851234567904',
          name: 'Lookalike - Leads 1%',
          status: 'ACTIVE',
          daily_budget: 60,
          optimization_goal: 'LEAD',
          metrics: createMetrics({ impressions: 64000, clicks: 730, spend: 820, reach: 12900, conversions: 16, roas: 3.5, frequency: 4.96 }),
          ads: [
            {
              id: 'ad-2-2-1',
              fb_ad_id: '23851234567905',
              name: 'Testimonial Static',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 34000, clicks: 390, spend: 430, reach: 6800, conversions: 9, roas: 3.7, frequency: 5.0 }),
            },
            {
              id: 'ad-2-2-2',
              fb_ad_id: '23851234567906',
              name: 'Benefits List Banner',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 30000, clicks: 340, spend: 390, reach: 6100, conversions: 7, roas: 3.2, frequency: 4.92 }),
            },
          ],
        },
      ],
    },
    {
      id: 'camp-3',
      fb_campaign_id: '23851234567910',
      name: 'Awareness - Brand',
      status: 'ACTIVE',
      objective: 'BRAND_AWARENESS',
      daily_budget: 100,
      metrics: createMetrics({ impressions: 320000, clicks: 2450, spend: 2000, reach: 45000, conversions: 12, roas: 1.8, frequency: 7.11 }),
      adsets: [
        {
          id: 'adset-3-1',
          fb_adset_id: '23851234567911',
          name: 'Público Amplo 25-45',
          status: 'ACTIVE',
          daily_budget: 50,
          optimization_goal: 'REACH',
          metrics: createMetrics({ impressions: 180000, clicks: 1380, spend: 1100, reach: 25000, conversions: 7, roas: 1.9, frequency: 7.2 }),
          ads: [
            {
              id: 'ad-3-1-1',
              fb_ad_id: '23851234567912',
              name: 'Brand Story Video 30s',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 98000, clicks: 750, spend: 600, reach: 13600, conversions: 4, roas: 2.0, frequency: 7.2 }),
            },
            {
              id: 'ad-3-1-2',
              fb_ad_id: '23851234567913',
              name: 'Mission Statement Static',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 82000, clicks: 630, spend: 500, reach: 11400, conversions: 3, roas: 1.8, frequency: 7.19 }),
            },
          ],
        },
        {
          id: 'adset-3-2',
          fb_adset_id: '23851234567914',
          name: 'Interesse - Empreendedorismo',
          status: 'ACTIVE',
          daily_budget: 50,
          optimization_goal: 'REACH',
          metrics: createMetrics({ impressions: 140000, clicks: 1070, spend: 900, reach: 20000, conversions: 5, roas: 1.7, frequency: 7.0 }),
          ads: [
            {
              id: 'ad-3-2-1',
              fb_ad_id: '23851234567915',
              name: 'Founder Story Reels',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 75000, clicks: 580, spend: 480, reach: 10700, conversions: 3, roas: 1.8, frequency: 7.01 }),
            },
            {
              id: 'ad-3-2-2',
              fb_ad_id: '23851234567916',
              name: 'Values Carousel',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 65000, clicks: 490, spend: 420, reach: 9300, conversions: 2, roas: 1.5, frequency: 6.99 }),
            },
          ],
        },
      ],
    },
    {
      id: 'camp-4',
      fb_campaign_id: '23851234567920',
      name: 'Conversão - Produto Principal',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      daily_budget: 200,
      metrics: createMetrics({ impressions: 95000, clicks: 980, spend: 1650, reach: 8500, conversions: 52, roas: 5.8, frequency: 11.18 }),
      adsets: [
        {
          id: 'adset-4-1',
          fb_adset_id: '23851234567921',
          name: 'Carrinho Abandonado 3 dias',
          status: 'ACTIVE',
          daily_budget: 100,
          optimization_goal: 'PURCHASE',
          metrics: createMetrics({ impressions: 52000, clicks: 540, spend: 900, reach: 4600, conversions: 32, roas: 6.5, frequency: 11.3 }),
          ads: [
            {
              id: 'ad-4-1-1',
              fb_ad_id: '23851234567922',
              name: 'Urgency Banner Desconto',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 28000, clicks: 295, spend: 490, reach: 2500, conversions: 18, roas: 6.8, frequency: 11.2 }),
            },
            {
              id: 'ad-4-1-2',
              fb_ad_id: '23851234567923',
              name: 'Review Video Cliente',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 24000, clicks: 245, spend: 410, reach: 2100, conversions: 14, roas: 6.1, frequency: 11.43 }),
            },
          ],
        },
        {
          id: 'adset-4-2',
          fb_adset_id: '23851234567924',
          name: 'Carrinho Abandonado 7 dias',
          status: 'ACTIVE',
          daily_budget: 100,
          optimization_goal: 'PURCHASE',
          metrics: createMetrics({ impressions: 43000, clicks: 440, spend: 750, reach: 3900, conversions: 20, roas: 4.9, frequency: 11.03 }),
          ads: [
            {
              id: 'ad-4-2-1',
              fb_ad_id: '23851234567925',
              name: 'Last Chance Offer',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 23000, clicks: 235, spend: 400, reach: 2100, conversions: 12, roas: 5.2, frequency: 10.95 }),
            },
            {
              id: 'ad-4-2-2',
              fb_ad_id: '23851234567926',
              name: 'Bonus Pack Carousel',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 20000, clicks: 205, spend: 350, reach: 1800, conversions: 8, roas: 4.5, frequency: 11.11 }),
            },
          ],
        },
      ],
    },
    {
      id: 'camp-5',
      fb_campaign_id: '23851234567930',
      name: 'Tráfego - Blog Content',
      status: 'ACTIVE',
      objective: 'TRAFFIC',
      daily_budget: 80,
      metrics: createMetrics({ impressions: 420000, clicks: 2800, spend: 950, reach: 62000, conversions: 8, roas: 1.2, frequency: 6.77 }),
      adsets: [
        {
          id: 'adset-5-1',
          fb_adset_id: '23851234567931',
          name: 'Artigos Populares',
          status: 'ACTIVE',
          daily_budget: 40,
          optimization_goal: 'LINK_CLICKS',
          metrics: createMetrics({ impressions: 230000, clicks: 1550, spend: 520, reach: 34000, conversions: 5, roas: 1.3, frequency: 6.76 }),
          ads: [
            {
              id: 'ad-5-1-1',
              fb_ad_id: '23851234567932',
              name: 'Top 10 Tips Article',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 125000, clicks: 850, spend: 285, reach: 18500, conversions: 3, roas: 1.4, frequency: 6.76 }),
            },
            {
              id: 'ad-5-1-2',
              fb_ad_id: '23851234567933',
              name: 'How To Guide Banner',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 105000, clicks: 700, spend: 235, reach: 15500, conversions: 2, roas: 1.2, frequency: 6.77 }),
            },
          ],
        },
        {
          id: 'adset-5-2',
          fb_adset_id: '23851234567934',
          name: 'Novos Artigos',
          status: 'ACTIVE',
          daily_budget: 40,
          optimization_goal: 'LINK_CLICKS',
          metrics: createMetrics({ impressions: 190000, clicks: 1250, spend: 430, reach: 28000, conversions: 3, roas: 1.1, frequency: 6.79 }),
          ads: [
            {
              id: 'ad-5-2-1',
              fb_ad_id: '23851234567935',
              name: 'Weekly Newsletter Promo',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 100000, clicks: 660, spend: 225, reach: 14700, conversions: 2, roas: 1.2, frequency: 6.8 }),
            },
            {
              id: 'ad-5-2-2',
              fb_ad_id: '23851234567936',
              name: 'Latest Post Carousel',
              status: 'ACTIVE',
              metrics: createMetrics({ impressions: 90000, clicks: 590, spend: 205, reach: 13300, conversions: 1, roas: 0.9, frequency: 6.77 }),
            },
          ],
        },
      ],
    },
  ],
  totals: createMetrics({
    impressions: 1162000,
    clicks: 9770,
    spend: 9200,
    reach: 156500,
    conversions: 155,
    roas: 3.48,
    frequency: 7.43,
  }),
  lastUpdated: new Date().toISOString(),
};
