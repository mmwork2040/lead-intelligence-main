// ============= DEMO DATA =============
// Dados fictícios realistas para o modo demonstração

export const demoDashboardMetrics = {
  totalLeads: 1284,
  leadsChange: "+18.3%",
  leadsChangeTrend: "up" as const,
  totalSales: 156,
  salesChange: "+24.7%",
  salesChangeTrend: "up" as const,
  totalRevenue: 47500,
  revenueChange: "+32.1%",
  revenueChangeTrend: "up" as const,
  totalAdSpend: 14843.75,
  adSpendChange: "+12.5%",
  adSpendChangeTrend: "up" as const,
  conversionRate: "12.1%",
  roas: "3.20x",
  chartData: [
    { date: "01/02", leads: 42, sales: 5, revenue: 1850 },
    { date: "03/02", leads: 38, sales: 7, revenue: 2590 },
    { date: "05/02", leads: 55, sales: 4, revenue: 1480 },
    { date: "07/02", leads: 61, sales: 9, revenue: 3330 },
    { date: "09/02", leads: 48, sales: 6, revenue: 2220 },
    { date: "11/02", leads: 72, sales: 11, revenue: 4070 },
    { date: "13/02", leads: 65, sales: 8, revenue: 2960 },
    { date: "15/02", leads: 58, sales: 10, revenue: 3700 },
    { date: "17/02", leads: 83, sales: 12, revenue: 4440 },
    { date: "19/02", leads: 76, sales: 14, revenue: 5180 },
    { date: "21/02", leads: 69, sales: 9, revenue: 3330 },
    { date: "23/02", leads: 91, sales: 16, revenue: 5920 },
  ],
  revenueData: [
    { date: "01/02", revenue: 1850 },
    { date: "05/02", revenue: 3480 },
    { date: "09/02", revenue: 2220 },
    { date: "13/02", revenue: 4960 },
    { date: "17/02", revenue: 5440 },
    { date: "21/02", revenue: 6330 },
    { date: "23/02", revenue: 7920 },
  ],
  sourceData: [
    { name: "Facebook Ads", leads: 486, sales: 62 },
    { name: "Google Ads", leads: 312, sales: 38 },
    { name: "Instagram", leads: 198, sales: 24 },
    { name: "WhatsApp", leads: 156, sales: 18 },
    { name: "Orgânico", leads: 87, sales: 9 },
    { name: "E-mail", leads: 45, sales: 5 },
  ],
  conversionData: [
    { stage: "Lead", value: 1284, fill: "hsl(var(--chart-1))" },
    { stage: "Engajado", value: 742, fill: "hsl(var(--chart-2))" },
    { stage: "Aquecido", value: 385, fill: "hsl(var(--chart-3))" },
    { stage: "Carrinho", value: 218, fill: "hsl(var(--chart-4))" },
    { stage: "Comprador", value: 156, fill: "hsl(var(--chart-5))" },
  ],
  topProductsData: [
    { name: "Curso Marketing Digital Pro", sales: 64, revenue: 19200 },
    { name: "Mentoria Tráfego Pago", sales: 42, revenue: 12600 },
    { name: "E-book Copywriting", sales: 28, revenue: 2800 },
    { name: "Workshop Funis de Venda", sales: 15, revenue: 7500 },
    { name: "Pack Templates Social", sales: 7, revenue: 1400 },
  ],
  recentEvents: [
    { id: "e1", activity_type: "cliente", event_type: "new_purchase", created_at: "2026-02-23T14:32:00Z", lead_id: "l1", name: "Maria Silva", email: "maria@email.com", source: "Facebook Ads", product_name: "Curso Marketing Digital Pro", value: 297 },
    { id: "e2", activity_type: "lead", event_type: "new_lead", created_at: "2026-02-23T14:15:00Z", lead_id: "l2", name: "João Santos", email: "joao@email.com", source: "Google Ads", product_name: null, value: null },
    { id: "e3", activity_type: "status_change", event_type: "status_changed", created_at: "2026-02-23T13:48:00Z", lead_id: "l3", name: "Ana Oliveira", email: "ana@email.com", source: null, product_name: null, value: null, old_status: "aquecido", new_status: "carrinho" },
    { id: "e4", activity_type: "cliente", event_type: "new_purchase", created_at: "2026-02-23T12:20:00Z", lead_id: "l4", name: "Carlos Mendes", email: "carlos@email.com", source: "Instagram", product_name: "Mentoria Tráfego Pago", value: 497 },
    { id: "e5", activity_type: "lead", event_type: "new_lead", created_at: "2026-02-23T11:55:00Z", lead_id: "l5", name: "Fernanda Lima", email: "fernanda@email.com", source: "WhatsApp", product_name: null, value: null },
  ],
};

export const demoLeads = {
  data: [
    { id: "1", lead_id: "l1", name: "Maria Silva", email: "maria.silva@email.com", phone: "(11) 99999-1234", source: "hotmart", crm_status: "comprador", utm_source: "facebook", utm_campaign: "black-friday", created_at: "2026-02-20T10:30:00Z", updated_at: "2026-02-23T14:00:00Z", city: "São Paulo", state: "SP", country: "BR", products: [{ name: "Curso Marketing Digital Pro", slug: "curso-mkt" }], tags: [{ id: "t1", name: "VIP", color: "#FFD700" }], totalValue: 594, totalPurchases: 2, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "black-friday", utm_content: null, utm_medium: null, utm_term: null },
    { id: "2", lead_id: "l2", name: "João Santos", email: "joao.santos@email.com", phone: "(21) 98888-5678", source: "manychat", crm_status: "aquecido", utm_source: "google", utm_campaign: "remarketing", created_at: "2026-02-21T08:15:00Z", updated_at: "2026-02-22T16:00:00Z", city: "Rio de Janeiro", state: "RJ", country: "BR", products: [], tags: [{ id: "t2", name: "Quente", color: "#FF6B35" }], totalValue: 0, totalPurchases: 0, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "remarketing", utm_content: null, utm_medium: null, utm_term: null },
    { id: "3", lead_id: "l3", name: "Ana Oliveira", email: "ana.oliveira@email.com", phone: "(31) 97777-9012", source: "organic", crm_status: "engajado", utm_source: "organic", utm_campaign: null, created_at: "2026-02-19T14:20:00Z", updated_at: "2026-02-21T09:00:00Z", city: "Belo Horizonte", state: "MG", country: "BR", products: [], tags: [], totalValue: 0, totalPurchases: 0, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: null, utm_content: null, utm_medium: null, utm_term: null },
    { id: "4", lead_id: "l4", name: "Carlos Mendes", email: "carlos.mendes@email.com", phone: "(41) 96666-3456", source: "whatsapp", crm_status: "comprador", utm_source: "instagram", utm_campaign: "stories-jan", created_at: "2026-02-18T11:00:00Z", updated_at: "2026-02-23T12:00:00Z", city: "Curitiba", state: "PR", country: "BR", products: [{ name: "Mentoria Tráfego Pago", slug: "mentoria-tp" }], tags: [{ id: "t1", name: "VIP", color: "#FFD700" }, { id: "t3", name: "Recorrente", color: "#4CAF50" }], totalValue: 997, totalPurchases: 1, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "stories-jan", utm_content: null, utm_medium: null, utm_term: null },
    { id: "5", lead_id: "l5", name: "Fernanda Lima", email: "fernanda.lima@email.com", phone: "(51) 95555-7890", source: "manychat", crm_status: "lead", utm_source: "facebook", utm_campaign: "lead-magnet", created_at: "2026-02-23T11:55:00Z", updated_at: "2026-02-23T11:55:00Z", city: "Porto Alegre", state: "RS", country: "BR", products: [], tags: [{ id: "t4", name: "Novo", color: "#2196F3" }], totalValue: 0, totalPurchases: 0, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "lead-magnet", utm_content: null, utm_medium: null, utm_term: null },
    { id: "6", lead_id: "l6", name: "Roberto Alves", email: "roberto@email.com", phone: "(85) 94444-1234", source: "hotmart", crm_status: "carrinho", utm_source: "facebook", utm_campaign: "black-friday", created_at: "2026-02-17T09:30:00Z", updated_at: "2026-02-22T15:00:00Z", city: "Fortaleza", state: "CE", country: "BR", products: [], tags: [{ id: "t2", name: "Quente", color: "#FF6B35" }], totalValue: 0, totalPurchases: 0, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "black-friday", utm_content: null, utm_medium: null, utm_term: null },
    { id: "7", lead_id: "l7", name: "Patrícia Costa", email: "patricia@email.com", phone: "(71) 93333-5678", source: "organic", crm_status: "comprador", utm_source: "google", utm_campaign: null, created_at: "2026-02-15T16:45:00Z", updated_at: "2026-02-20T10:00:00Z", city: "Salvador", state: "BA", country: "BR", products: [{ name: "E-book Copywriting", slug: "ebook-copy" }], tags: [{ id: "t1", name: "VIP", color: "#FFD700" }], totalValue: 97, totalPurchases: 1, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: null, utm_content: null, utm_medium: null, utm_term: null },
    { id: "8", lead_id: "l8", name: "Lucas Pereira", email: "lucas.p@email.com", phone: "(62) 92222-9012", source: "manychat", crm_status: "engajado", utm_source: "instagram", utm_campaign: "reels-fev", created_at: "2026-02-22T13:00:00Z", updated_at: "2026-02-23T08:00:00Z", city: "Goiânia", state: "GO", country: "BR", products: [], tags: [], totalValue: 0, totalPurchases: 0, cpf: null, birth_date: null, gender: null, client_type: null, complement: null, neighborhood: null, region: null, street: null, street_number: null, zip_code: null, metadata: null, project_slug: "reels-fev", utm_content: null, utm_medium: null, utm_term: null },
  ],
  total: 1284,
  page: 1,
  pageSize: 50,
  totalPages: 26,
};

export const demoCampaigns = [
  { id: "c1", name: "Black Friday 2026", slug: "black-friday", color: "#FF6B35", is_active: true, ad_spend: 5200, start_date: "2026-01-15", end_date: "2026-03-15", products: ["curso-mkt", "mentoria-tp"], pixel_code: "FB-12345", created_at: "2026-01-10T10:00:00Z", updated_at: "2026-02-23T10:00:00Z" },
  { id: "c2", name: "Remarketing Fevereiro", slug: "remarketing", color: "#4CAF50", is_active: true, ad_spend: 3200, start_date: "2026-02-01", end_date: "2026-02-28", products: ["curso-mkt"], pixel_code: null, created_at: "2026-01-28T10:00:00Z", updated_at: "2026-02-20T10:00:00Z" },
  { id: "c3", name: "Lead Magnet E-book", slug: "lead-magnet", color: "#2196F3", is_active: true, ad_spend: 1800, start_date: "2026-02-10", end_date: "2026-03-10", products: ["ebook-copy"], pixel_code: null, created_at: "2026-02-08T10:00:00Z", updated_at: "2026-02-22T10:00:00Z" },
  { id: "c4", name: "Stories Janeiro", slug: "stories-jan", color: "#9C27B0", is_active: false, ad_spend: 2400, start_date: "2026-01-01", end_date: "2026-01-31", products: ["mentoria-tp"], pixel_code: null, created_at: "2025-12-28T10:00:00Z", updated_at: "2026-01-31T10:00:00Z" },
];

export const demoProducts = [
  { id: "p1", name: "Curso Marketing Digital Pro", slug: "curso-mkt", price: 297, type: "curso", description: "Curso completo de marketing digital com certificado", is_active: true, image_url: null, metadata: null, created_at: "2025-10-01T10:00:00Z", updated_at: "2026-02-20T10:00:00Z" },
  { id: "p2", name: "Mentoria Tráfego Pago", slug: "mentoria-tp", price: 497, type: "mentoria", description: "Mentoria individual de tráfego pago por 3 meses", is_active: true, image_url: null, metadata: null, created_at: "2025-11-15T10:00:00Z", updated_at: "2026-02-18T10:00:00Z" },
  { id: "p3", name: "E-book Copywriting Persuasivo", slug: "ebook-copy", price: 97, type: "ebook", description: "Guia prático de copywriting para vendas online", is_active: true, image_url: null, metadata: null, created_at: "2026-01-05T10:00:00Z", updated_at: "2026-02-15T10:00:00Z" },
  { id: "p4", name: "Workshop Funis de Venda", slug: "workshop-funis", price: 497, type: "workshop", description: "Workshop intensivo de 2 dias sobre funis de venda", is_active: true, image_url: null, metadata: null, created_at: "2026-01-20T10:00:00Z", updated_at: "2026-02-10T10:00:00Z" },
  { id: "p5", name: "Pack Templates Social Media", slug: "pack-templates", price: 197, type: "template", description: "Pack com 100+ templates editáveis para redes sociais", is_active: true, image_url: null, metadata: null, created_at: "2026-02-01T10:00:00Z", updated_at: "2026-02-22T10:00:00Z" },
];

export const demoFinancialMetrics = {
  revenue: 47500,
  refunds: 1485,
  recurringRevenue: 8940,
  revenueBySource: [
    { source: "Facebook Ads", value: 18620, count: 62 },
    { source: "Google Ads", value: 11400, count: 38 },
    { source: "Instagram", value: 7200, count: 24 },
    { source: "WhatsApp", value: 5400, count: 18 },
    { source: "Orgânico", value: 2700, count: 9 },
    { source: "E-mail", value: 2180, count: 5 },
  ],
};

export const demoTourSteps = [
  {
    title: "Bem-vindo ao Leads Intel! 👋",
    description: "Aqui você tem uma visão geral do desempenho das suas campanhas e vendas em tempo real. Vamos fazer um tour rápido!",
    target: "dashboard-header",
  },
  {
    title: "Métricas Principais 📊",
    description: "Esses cards mostram seus KPIs mais importantes: leads, vendas, receita e ROAS — com comparações ao período anterior.",
    target: "metric-cards",
  },
  {
    title: "Gráficos Interativos 📈",
    description: "Explore gráficos de leads vs vendas, receita, fontes de tráfego e funil de conversão. Tudo atualizado em tempo real.",
    target: "chart-area",
  },
  {
    title: "Navegação Completa 🧭",
    description: "Use o menu lateral para acessar Leads, CRM, Campanhas, Produtos, Financeiro, Relatórios e muito mais!",
    target: "sidebar-nav",
  },
  {
    title: "Pronto para começar! 🚀",
    description: "Explore à vontade! Quando quiser usar todas as funcionalidades, crie sua conta gratuita.",
    target: null,
  },
];
