# 📘 Leads Intelligence Platform - Guia Técnico do Desenvolvedor

**Versão:** 1.0.0  
**Data:** Dezembro 2024  
**Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase (Lovable Cloud)

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Banco de Dados](#4-banco-de-dados)
5. [Autenticação e Permissões](#5-autenticação-e-permissões)
6. [Módulos do Sistema](#6-módulos-do-sistema)
7. [Edge Functions (Backend)](#7-edge-functions-backend)
8. [Hooks Customizados](#8-hooks-customizados)
9. [Design System](#9-design-system)
10. [Integrações Externas](#10-integrações-externas)
11. [Guia de Replicação](#11-guia-de-replicação)
12. [Troubleshooting](#12-troubleshooting)
13. [Anexos](#13-anexos)

---

## 1. Visão Geral do Sistema

### 1.1 Descrição
Sistema completo de gestão de leads e campanhas para infoprodutos, com foco em:
- Captura e unificação inteligente de leads
- Gestão de campanhas e metas
- Pipeline CRM comercial
- Módulo financeiro com geração de notas fiscais
- Integração com Facebook Ads e Hotmart
- Assistente de IA para análise de dados
- Pesquisas MQL (Marketing Qualified Leads)

### 1.2 Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React | 18.3.1 |
| Bundler | Vite | Latest |
| Linguagem | TypeScript | 5.x |
| Estilização | Tailwind CSS | 3.x |
| Componentes UI | shadcn/ui + Radix | Latest |
| Estado/Cache | TanStack Query | 5.x |
| Roteamento | React Router DOM | 6.x |
| Backend | Supabase (Lovable Cloud) | - |
| Banco de Dados | PostgreSQL | 15.x |
| Auth | Supabase Auth | - |
| Edge Functions | Deno | - |
| IA | Lovable AI (Gemini) | - |

### 1.3 Funcionalidades Principais

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEADS INTELLIGENCE PLATFORM                   │
├─────────────────────────────────────────────────────────────────┤
│  📊 Dashboard    │  👥 Leads       │  📦 Produtos   │  📢 Campanhas │
│  - Métricas      │  - Captura      │  - Catálogo    │  - Metas      │
│  - Gráficos      │  - Unificação   │  - Ofertas     │  - Tracking   │
│  - Filtros       │  - Timeline     │  - Hotmart     │  - ROI/ROAS   │
├─────────────────────────────────────────────────────────────────┤
│  💼 CRM          │  💰 Financeiro  │  📈 Relatórios │  🤖 IA        │
│  - Kanban        │  - Receitas     │  - Facebook    │  - Análise    │
│  - Pipeline      │  - Notas        │  - Hierárquico │  - Sugestões  │
│  - Follow-ups    │  - Exportação   │  - Filtros     │  - Chat       │
├─────────────────────────────────────────────────────────────────┤
│  📝 Pesquisas    │  🔗 Integrações │  ⚙️ Configurações             │
│  - MQL Scoring   │  - Hotmart      │  - Usuários                   │
│  - Analytics     │  - Facebook Ads │  - Permissões                 │
│  - Ranking       │  - ManyChat/N8N │  - Tracking Pixel             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Arquitetura do Sistema

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Pages     │  │ Components  │  │   Hooks     │  │  Contexts   │     │
│  │  (Routes)   │  │    (UI)     │  │  (Logic)    │  │   (State)   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │                │             │
│         └────────────────┴────────────────┴────────────────┘             │
│                                    │                                     │
│                          ┌─────────▼─────────┐                           │
│                          │  Supabase Client  │                           │
│                          │  (SDK + Realtime) │                           │
│                          └─────────┬─────────┘                           │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
           ┌────────▼────────┐ ┌─────▼─────┐ ┌───────▼───────┐
           │  Edge Functions │ │ Database  │ │    Storage    │
           │     (Deno)      │ │(PostgreSQL)│ │   (Buckets)   │
           └────────┬────────┘ └─────┬─────┘ └───────────────┘
                    │                │
    ┌───────────────┼────────────────┼───────────────┐
    │               │                │               │
┌───▼───┐     ┌─────▼─────┐    ┌─────▼─────┐   ┌─────▼─────┐
│Hotmart│     │ Facebook  │    │  ManyChat │   │   N8N     │
│Webhook│     │  Ads API  │    │  Webhook  │   │  Webhook  │
└───────┘     └───────────┘    └───────────┘   └───────────┘
```

### 2.2 Fluxo de Autenticação

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Usuário │───▶│  Auth Page   │───▶│ Supabase Auth│───▶│   Trigger    │
│          │    │ (Login/Sign) │    │   (Email)    │    │handle_new_user│
└──────────┘    └──────────────┘    └──────────────┘    └───────┬──────┘
                                                                │
     ┌──────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ Criar Profile  │───▶│ Verificar Email│───▶│ Atribuir Role  │
│ (profiles)     │    │ (super admin?) │    │ (user_roles)   │
└────────────────┘    └────────────────┘    └────────────────┘
                                                    │
                                                    ▼
                                           ┌────────────────┐
                                           │  Redirecionar  │
                                           │  ao Dashboard  │
                                           └────────────────┘
```

### 2.3 Fluxo de Dados (Webhook Hotmart)

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Hotmart │────▶│ Edge Function│────▶│ Validar Token│────▶│  Log Webhook │
│  Event  │     │webhook-hotmart│    │ (x-hotmart-  │     │(webhook_logs)│
└─────────┘     └──────────────┘     │   hottok)    │     └──────┬───────┘
                                     └──────────────┘            │
                                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Atualizar   │◀────│Criar Purchase│◀────│ Criar/Update │◀────│ Buscar Lead  │
│  CRM Status  │     │  (purchases) │     │    Lead      │     │(email/phone) │
│ (comprador)  │     └──────────────┘     │   (leads)    │     └──────────────┘
└──────────────┘                          └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Criar Evento │────▶│   Trigger    │
│(lead_events) │     │ Invoice Req. │
└──────────────┘     └──────────────┘
```

---

## 3. Estrutura do Projeto

### 3.1 Árvore de Diretórios

```
leads-intelligence-platform/
├── 📁 public/                    # Arquivos estáticos
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── 📁 src/                       # Código fonte principal
│   ├── 📁 assets/                # Imagens e recursos
│   │
│   ├── 📁 components/            # Componentes React
│   │   ├── 📁 admin/             # Componentes administrativos
│   │   │   └── UserManagementDialog.tsx
│   │   │
│   │   ├── 📁 ai/                # Componentes de IA
│   │   │   ├── AIAssistant.tsx
│   │   │   └── AIMessage.tsx
│   │   │
│   │   ├── 📁 campaigns/         # Componentes de campanhas
│   │   │   ├── CampaignDialog.tsx
│   │   │   ├── CampaignGoalDialog.tsx
│   │   │   ├── CampaignGoalProgress.tsx
│   │   │   └── CampaignGoalsSection.tsx
│   │   │
│   │   ├── 📁 crm/               # Componentes do CRM
│   │   │   └── ProductFilter.tsx
│   │   │
│   │   ├── 📁 dashboard/         # Componentes do dashboard
│   │   │   ├── ChartTabs.tsx
│   │   │   ├── ConversionChart.tsx
│   │   │   ├── EmptyChart.tsx
│   │   │   ├── LeadsSalesChart.tsx
│   │   │   ├── PeriodSelector.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── SourcePieChart.tsx
│   │   │   └── TopProductsChart.tsx
│   │   │
│   │   ├── 📁 leads/             # Componentes de leads
│   │   │   ├── AIColumnSuggestions.tsx
│   │   │   ├── BulkTagActions.tsx
│   │   │   ├── ColumnMapper.tsx
│   │   │   ├── LeadDialog.tsx
│   │   │   ├── LeadFilters.tsx
│   │   │   ├── LeadFunnelView.tsx
│   │   │   ├── LeadImportDialog.tsx
│   │   │   ├── LeadMQLBadge.tsx
│   │   │   ├── LeadVersionHistory.tsx
│   │   │   ├── LeadsPagination.tsx
│   │   │   ├── MergeLogsTimeline.tsx
│   │   │   ├── PurchaseDialog.tsx
│   │   │   ├── SendToFinancialDialog.tsx
│   │   │   ├── TagSelector.tsx
│   │   │   └── UnificationReviewDialog.tsx
│   │   │
│   │   ├── 📁 products/          # Componentes de produtos
│   │   │   ├── ProductDialog.tsx
│   │   │   └── ProductOffersCount.tsx
│   │   │
│   │   ├── 📁 reports/           # Componentes de relatórios
│   │   │   ├── CampaignBreakdownTable.tsx
│   │   │   ├── FacebookAdMetricCard.tsx
│   │   │   ├── FacebookAdsFilters.tsx
│   │   │   ├── FacebookAdsPerformanceChart.tsx
│   │   │   ├── FacebookAdsTimelineChart.tsx
│   │   │   ├── FacebookClicksByCampaignChart.tsx
│   │   │   ├── FacebookGaugeChart.tsx
│   │   │   ├── FacebookMetricSelector.tsx
│   │   │   ├── FacebookReachChart.tsx
│   │   │   ├── FacebookReportFilters.tsx
│   │   │   ├── FacebookSpendingByCampaignChart.tsx
│   │   │   ├── FacebookTopAdsChart.tsx
│   │   │   ├── HierarchicalReportTable.tsx
│   │   │   ├── MetricSelector.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── ProductFunnel.tsx
│   │   │   ├── ProductFunnelGrid.tsx
│   │   │   └── ReportFilters.tsx
│   │   │
│   │   ├── 📁 surveys/           # Componentes de pesquisas
│   │   │   ├── MQLTemplates.tsx
│   │   │   ├── SurveyAIAnalysis.tsx
│   │   │   ├── SurveyAnalyticsDashboard.tsx
│   │   │   ├── SurveyChartsGrid.tsx
│   │   │   ├── SurveyDialog.tsx
│   │   │   ├── SurveyPatternsAnalysis.tsx
│   │   │   ├── SurveyQuestionEditor.tsx
│   │   │   ├── SurveyRankingTable.tsx
│   │   │   ├── SurveyResponseImportDialog.tsx
│   │   │   └── SurveyResponsesTable.tsx
│   │   │
│   │   ├── 📁 tracking/          # Componentes de tracking
│   │   │   ├── FacebookUTMGenerator.tsx
│   │   │   ├── OrganicLinkGenerator.tsx
│   │   │   ├── TrackingPixelGenerator.tsx
│   │   │   └── WhatsAppLinkGenerator.tsx
│   │   │
│   │   ├── 📁 ui/                # Componentes shadcn/ui
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx        # Variantes: default, glow, destructive, etc.
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx          # Variantes: glass, gradient, glow
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── form-field.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── loading-button.tsx
│   │   │   ├── page-skeleton.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── skip-link.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── visually-hidden.tsx
│   │   │
│   │   ├── BottomNav.tsx         # Navegação mobile
│   │   ├── Breadcrumbs.tsx       # Breadcrumbs
│   │   ├── DashboardLayout.tsx   # Layout principal
│   │   ├── LandingHero.tsx       # Hero da landing
│   │   ├── MetricCard.tsx        # Card de métrica
│   │   ├── NavLink.tsx           # Link de navegação
│   │   ├── ProtectedRoute.tsx    # Rota protegida
│   │   └── ThemeToggle.tsx       # Toggle dark/light
│   │
│   ├── 📁 contexts/              # Contextos React
│   │   └── AuthContext.tsx       # Contexto de autenticação
│   │
│   ├── 📁 data/                  # Dados mock/constantes
│   │   └── mockData.ts
│   │
│   ├── 📁 hooks/                 # Hooks customizados
│   │   ├── use-mobile.tsx        # Detecção mobile
│   │   ├── use-toast.ts          # Sistema de toasts
│   │   ├── useAdvancedReports.ts
│   │   ├── useAutoSyncFacebookAds.ts
│   │   ├── useBulkTagOperations.ts
│   │   ├── useCampaignGoals.ts
│   │   ├── useCampaignROAS.ts
│   │   ├── useCampaigns.ts
│   │   ├── useCRMPipeline.ts
│   │   ├── useDashboardMetrics.ts
│   │   ├── useDynamicMQLScore.ts
│   │   ├── useFacebookAds.ts
│   │   ├── useFacebookAdsConfig.ts
│   │   ├── useFacebookAdsHierarchicalReports.ts
│   │   ├── useFacebookAdsets.ts
│   │   ├── useFacebookCampaigns.ts
│   │   ├── useFinancialMetrics.ts
│   │   ├── useGoals.ts
│   │   ├── useImportLeads.ts
│   │   ├── useInvoiceRequests.ts
│   │   ├── useLeadEvents.ts
│   │   ├── useLeads.ts
│   │   ├── useLeadScore.ts
│   │   ├── useLeadsSummary.ts
│   │   ├── useLeadUnification.ts
│   │   ├── useLeadVersions.ts
│   │   ├── useProcessExistingProducts.ts
│   │   ├── useProductFunnels.ts
│   │   ├── useProductMetrics.ts
│   │   ├── useProductOffers.ts
│   │   ├── useProducts.ts
│   │   ├── usePurchases.ts
│   │   ├── useSourceMetrics.ts
│   │   ├── useSurveyResponses.ts
│   │   ├── useSurveys.ts
│   │   ├── useTags.ts
│   │   ├── useTheme.ts
│   │   ├── useTransactions.ts
│   │   ├── useUserRole.ts
│   │   ├── useUsers.ts
│   │   └── useWebhookLogs.ts
│   │
│   ├── 📁 integrations/          # Integrações
│   │   └── 📁 supabase/
│   │       ├── client.ts         # Cliente Supabase (auto-gerado)
│   │       └── types.ts          # Tipos do banco (auto-gerado)
│   │
│   ├── 📁 lib/                   # Utilitários
│   │   ├── 📁 export/            # Funções de exportação
│   │   │   ├── exportCSV.ts
│   │   │   ├── exportInvoices.ts
│   │   │   └── exportSurveyResponses.ts
│   │   │
│   │   ├── 📁 import/            # Funções de importação
│   │   │   ├── detectColumns.ts
│   │   │   └── parseFile.ts
│   │   │
│   │   ├── 📁 utils/
│   │   │   └── slugify.ts
│   │   │
│   │   ├── cep.ts                # API ViaCEP
│   │   ├── constants.ts          # Constantes do sistema
│   │   ├── dateUtils.ts          # Utilitários de data
│   │   ├── permissions.ts        # Sistema de permissões
│   │   ├── translations.ts       # Traduções PT-BR
│   │   ├── utils.ts              # Utilitários gerais (cn)
│   │   └── validations.ts        # Validações
│   │
│   ├── 📁 pages/                 # Páginas da aplicação
│   │   ├── AdvancedReports.tsx   # Relatórios Facebook Ads
│   │   ├── AIAssistant.tsx       # Assistente IA
│   │   ├── Auth.tsx              # Login/Cadastro
│   │   ├── Campaigns.tsx         # Campanhas
│   │   ├── CRM.tsx               # Pipeline CRM
│   │   ├── Dashboard.tsx         # Dashboard principal
│   │   ├── Financial.tsx         # Módulo financeiro
│   │   ├── Index.tsx             # Landing page
│   │   ├── Integrations.tsx      # Integrações
│   │   ├── LeadProfile.tsx       # Perfil do lead
│   │   ├── Leads.tsx             # Lista de leads
│   │   ├── NotFound.tsx          # 404
│   │   ├── Products.tsx          # Produtos
│   │   ├── Reports.tsx           # Relatórios gerais
│   │   ├── Settings.tsx          # Configurações
│   │   ├── Surveys.tsx           # Pesquisas MQL
│   │   ├── Tracking.tsx          # Geradores de links
│   │   ├── UserManagement.tsx    # Gestão de usuários
│   │   └── WebhookLogs.tsx       # Logs de webhooks
│   │
│   ├── App.css                   # Estilos globais
│   ├── App.tsx                   # Componente raiz
│   ├── index.css                 # Variáveis CSS/Tailwind
│   ├── main.tsx                  # Entry point
│   └── vite-env.d.ts             # Tipos Vite
│
├── 📁 supabase/                  # Backend Supabase
│   ├── 📁 functions/             # Edge Functions (Deno)
│   │   ├── 📁 ai-assistant/
│   │   │   └── index.ts
│   │   ├── 📁 sync-facebook-ads/
│   │   │   └── index.ts
│   │   ├── 📁 test-facebook-connection/
│   │   │   └── index.ts
│   │   ├── 📁 unify-leads/
│   │   │   └── index.ts
│   │   ├── 📁 webhook-hotmart/
│   │   │   └── index.ts
│   │   ├── 📁 webhook-manychat/
│   │   │   └── index.ts
│   │   ├── 📁 webhook-n8n/
│   │   │   └── index.ts
│   │   └── 📁 webhook-tracking-pixel/
│   │       └── index.ts
│   │
│   └── config.toml               # Configuração Edge Functions
│
├── .env                          # Variáveis de ambiente (auto-gerado)
├── eslint.config.js              # Configuração ESLint
├── index.html                    # HTML principal
├── package.json                  # Dependências
├── tailwind.config.ts            # Configuração Tailwind
├── tsconfig.json                 # Configuração TypeScript
└── vite.config.ts                # Configuração Vite
```

### 3.2 Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `LeadDialog.tsx` |
| Hooks | camelCase com "use" | `useLeads.ts` |
| Utilitários | camelCase | `dateUtils.ts` |
| Constantes | UPPER_SNAKE_CASE | `CRM_STATUS` |
| Arquivos CSS | kebab-case | `index.css` |
| Edge Functions | kebab-case | `webhook-hotmart` |
| Tabelas DB | snake_case | `lead_events` |

---

## 4. Banco de Dados

### 4.1 Diagrama ER (Entidade-Relacionamento)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     leads       │     │   lead_events   │     │   lead_tags     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ lead_id (PK)    │◀────│ lead_id (FK)    │     │ id (PK)         │
│ id              │     │ id (PK)         │     │ lead_id (FK)    │────▶
│ name            │     │ event_type      │     │ tag_id (FK)     │────▶
│ email           │     │ event_data      │     │ source          │
│ phone           │     │ source          │     │ created_at      │
│ cpf             │     │ created_at      │     └─────────────────┘
│ crm_status      │                              ┌─────────────────┐
│ source          │                              │      tags       │
│ utm_*           │                              ├─────────────────┤
│ project_slug    │                              │ id (PK)         │◀───
│ address fields  │                              │ name            │
│ created_at      │                              │ color           │
│ updated_at      │                              │ description     │
└────────┬────────┘                              │ source          │
         │                                       └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   purchases     │     │invoice_requests │     │    products     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ lead_id (FK)    │◀────│ lead_id (FK)    │     │ name            │
│ product_name    │     │ purchase_id (FK)│────▶│ slug            │
│ product_slug    │────▶│ value           │     │ description     │
│ value           │     │ description     │     │ price           │
│ gross_value     │     │ status          │     │ type            │
│ commission      │     │ lead_* fields   │     │ is_active       │
│ status          │     │ sent_at         │     │ image_url       │
│ payment_method  │     │ issued_at       │     │ metadata        │
│ platform        │     │ created_at      │     └────────┬────────┘
│ source          │     └─────────────────┘              │
│ utm_*           │                                      │
│ transaction_id  │                                      ▼
│ subscription_id │                              ┌─────────────────┐
│ is_recurring    │                              │ product_offers  │
│ purchase_date   │                              ├─────────────────┤
│ created_at      │                              │ id (PK)         │
└─────────────────┘                              │ product_id (FK) │
                                                 │ offer_name      │
┌─────────────────┐     ┌─────────────────┐      │ hotmart_code    │
│   campaigns     │     │     goals       │      │ offer_price     │
├─────────────────┤     ├─────────────────┤      │ offer_type      │
│ id (PK)         │◀────│ campaign_id (FK)│      │ is_active       │
│ name            │     │ id (PK)         │      └─────────────────┘
│ slug            │     │ name            │
│ start_date      │     │ metric_type     │
│ end_date        │     │ target_value    │
│ ad_spend        │     │ current_value   │
│ color           │     │ period_type     │
│ products[]      │     │ start_date      │
│ pixel_code      │     │ end_date        │
│ created_at      │     │ status          │
└─────────────────┘     │ product_slug    │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    surveys      │     │survey_responses │     │   user_roles    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │◀────│ survey_id (FK)  │     │ id (PK)         │
│ name            │     │ id (PK)         │     │ user_id (FK)    │
│ description     │     │ lead_id (FK)    │────▶│ role            │
│ campaign_id (FK)│────▶│ answers (JSONB) │     │ created_at      │
│ questions(JSONB)│     │ created_at      │     └─────────────────┘
│ is_active       │     └─────────────────┘
│ created_at      │                              ┌─────────────────┐
└─────────────────┘                              │    profiles     │
                                                 ├─────────────────┤
┌─────────────────┐     ┌─────────────────┐      │ id (PK/FK)      │
│  fb_campaigns   │     │   fb_adsets     │      │ email           │
├─────────────────┤     ├─────────────────┤      │ full_name       │
│ id (PK)         │     │ id (PK)         │      │ avatar_url      │
│ fb_campaign_id  │◀────│ fb_campaign_id  │      │ created_at      │
│ name            │     │ fb_adset_id     │      └─────────────────┘
│ status          │     │ name            │
│ objective       │     │ status          │
│ daily_budget    │     │ daily_budget    │      ┌─────────────────┐
│ campaign_slug   │     │ optimization    │      │   fb_metrics    │
│ metadata        │     │ targeting       │      ├─────────────────┤
└─────────────────┘     │ metadata        │      │ id (PK)         │
                        └────────┬────────┘      │ fb_campaign_id  │
                                 │               │ fb_adset_id     │
                                 ▼               │ fb_ad_id        │
                        ┌─────────────────┐      │ date_start/stop │
                        │    fb_ads       │      │ impressions     │
                        ├─────────────────┤      │ clicks          │
                        │ id (PK)         │      │ spend           │
                        │ fb_adset_id (FK)│      │ reach           │
                        │ fb_ad_id        │      │ cpc/cpm/ctr     │
                        │ fb_campaign_id  │      │ conversions     │
                        │ name            │      │ metadata        │
                        │ status          │      └─────────────────┘
                        │ creative_*      │
                        │ metadata        │
                        └─────────────────┘
```

### 4.2 Tabelas Principais

#### 4.2.1 leads
Tabela central do sistema, armazena todos os leads.

```sql
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  -- Endereço
  zip_code TEXT,
  street TEXT,
  street_number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  region TEXT, -- Auto-calculado do state
  -- CRM
  crm_status TEXT DEFAULT 'lead',
  source TEXT,
  -- UTMs
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  project_slug TEXT,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Status CRM válidos:**
| Status | Label | Descrição |
|--------|-------|-----------|
| `lead` | Lead Capturado | Lead recém-chegado |
| `engajado` | Engajado | Lead interagiu com conteúdo |
| `aquecido` | Aquecido | Lead pronto para oferta |
| `carrinho` | Carrinho | Lead iniciou checkout |
| `comprador` | Comprador | Lead convertido |
| `perdido` | Perdido | Oportunidade perdida |

#### 4.2.2 purchases
Registra todas as compras/transações.

```sql
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(lead_id),
  product_name TEXT NOT NULL,
  product_code TEXT,
  product_slug TEXT,
  -- Valores
  value NUMERIC,          -- Valor líquido (recebido)
  gross_value NUMERIC,    -- Valor bruto (original)
  commission NUMERIC,     -- Taxa da plataforma
  currency TEXT DEFAULT 'BRL',
  -- Pagamento
  status TEXT NOT NULL,   -- approved, pending, declined, refunded
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  transaction_id TEXT,
  -- Plataforma e origem
  platform TEXT,          -- hotmart, eduzz, stripe, etc.
  source TEXT,            -- Facebook Ads, organic, etc.
  utm_source TEXT,
  utm_campaign TEXT,
  project_slug TEXT,
  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  subscription_id TEXT,
  -- Datas
  purchase_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
```

#### 4.2.3 campaigns
Gerencia campanhas de marketing.

```sql
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  ad_spend NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  products TEXT[] DEFAULT '{}',
  pixel_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 Políticas RLS (Row Level Security)

O sistema usa RLS para controlar acesso aos dados. Exemplo de políticas:

```sql
-- Exemplo: Tabela leads

-- Admins podem tudo
CREATE POLICY "Admins can manage leads" ON leads
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Usuários autenticados podem ver leads
CREATE POLICY "Users can view leads" ON leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Desenvolvimento: políticas permissivas
CREATE POLICY "Allow all for development" ON leads
  FOR ALL USING (true) WITH CHECK (true);
```

**Função de verificação de role:**

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### 4.4 Triggers

#### handle_new_user
Trigger que cria profile e atribui role admin automaticamente.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  
  -- Atribuir admin se for email principal
  IF new.email = 'contato@osegredodoviajante.com' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (new.id, 'admin');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### create_invoice_request_on_purchase
Trigger que cria solicitação de NF automaticamente.

```sql
CREATE OR REPLACE FUNCTION create_invoice_request_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF NOT EXISTS (
      SELECT 1 FROM invoice_requests WHERE purchase_id = NEW.id
    ) THEN
      INSERT INTO invoice_requests (
        lead_id, purchase_id, lead_name, lead_email,
        lead_cpf, lead_phone, value, description, status
      )
      SELECT 
        NEW.lead_id, NEW.id, l.name, l.email,
        l.cpf, l.phone, NEW.value, NEW.product_name, 'pending'
      FROM leads l WHERE l.lead_id = NEW.lead_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Autenticação e Permissões

### 5.1 Sistema de Roles

O sistema implementa RBAC (Role-Based Access Control) com 4 roles:

| Role | Descrição | Acesso Principal |
|------|-----------|------------------|
| `admin` | Administrador total | Tudo |
| `commercial` | Equipe comercial | Leads, CRM, Campanhas |
| `financial` | Equipe financeira | Financeiro, Relatórios |
| `support` | Suporte ao cliente | Leads, Dashboard |

### 5.2 Matriz de Permissões

```typescript
// src/lib/permissions.ts

type Permission = 
  | 'view_dashboard'
  | 'manage_leads'
  | 'manage_campaigns'
  | 'manage_products'
  | 'view_financial'
  | 'manage_financial'
  | 'view_reports'
  | 'manage_users'
  | 'view_settings'
  | 'manage_settings'
  | 'view_integrations'
  | 'manage_integrations';

const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'view_dashboard',
    'manage_leads',
    'manage_campaigns',
    'manage_products',
    'view_financial',
    'manage_financial',
    'view_reports',
    'manage_users',
    'view_settings',
    'manage_settings',
    'view_integrations',
    'manage_integrations',
  ],
  commercial: [
    'view_dashboard',
    'manage_leads',
    'manage_campaigns',
    'view_reports',
  ],
  financial: [
    'view_dashboard',
    'view_financial',
    'manage_financial',
    'view_reports',
  ],
  support: [
    'view_dashboard',
    'manage_leads',
    'view_reports',
  ],
};
```

### 5.3 Hook useUserRole

```typescript
// src/hooks/useUserRole.ts

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .single();
      
      if (error) throw error;
      return data?.role;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { data: role } = useUserRole();
  return role === 'admin';
}
```

### 5.4 Componente ProtectedRoute

```typescript
// src/components/ProtectedRoute.tsx

export function ProtectedRoute({ 
  children, 
  requiredPermission 
}: {
  children: React.ReactNode;
  requiredPermission?: Permission;
}) {
  const { user, isLoading } = useAuth();
  const { data: role } = useUserRole();
  
  if (isLoading) return <PageSkeleton />;
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requiredPermission && role) {
    const permissions = rolePermissions[role] || [];
    if (!permissions.includes(requiredPermission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
}
```

---

## 6. Módulos do Sistema

### 6.1 Dashboard

**Página:** `/dashboard`  
**Arquivo:** `src/pages/Dashboard.tsx`

**Funcionalidades:**
- Métricas principais (leads, vendas, receita, conversão)
- Gráficos de performance temporal
- Gráfico de pizza por origem
- Filtros por período, campanha e produto
- Comparação com período anterior

**Hooks utilizados:**
- `useDashboardMetrics`: Métricas gerais
- `useSourceMetrics`: Métricas por origem
- `useCampaigns`: Lista de campanhas

**Exemplo de uso:**

```typescript
const { data: metrics, isLoading } = useDashboardMetrics({
  period: selectedPeriod, // '7d', '30d', 'custom', etc.
  campaignSlug: selectedCampaign,
  productSlug: selectedProduct,
});
```

### 6.2 Leads

**Página:** `/leads`  
**Arquivo:** `src/pages/Leads.tsx`

**Funcionalidades:**
- Lista paginada de leads
- Busca por nome, email, telefone
- Filtros avançados (período, produto, origem, tags)
- Seleção em massa (bulk)
- Adicionar/remover tags em massa
- Importação CSV/Excel
- Exportação CSV
- Criação/edição manual de leads

**Componentes principais:**
- `LeadFilters`: Filtros avançados
- `LeadDialog`: Criar/editar lead
- `LeadImportDialog`: Importação em massa
- `BulkTagActions`: Ações em massa
- `LeadsPagination`: Paginação

**Hooks utilizados:**
- `useLeads`: CRUD de leads
- `useTags`: Gerenciamento de tags
- `useBulkTagOperations`: Operações em massa
- `useImportLeads`: Importação

### 6.3 Perfil do Lead

**Página:** `/leads/:leadId`  
**Arquivo:** `src/pages/LeadProfile.tsx`

**Funcionalidades:**
- Visão geral com métricas
- Timeline de eventos (estilo Intercom)
- Lista de compras
- Dados pessoais editáveis
- Origem e UTMs
- Tags associadas
- Histórico de versões
- Envio para financeiro

**Componentes principais:**
- `LeadFunnelView`: Visualização do funil
- `LeadVersionHistory`: Histórico de alterações
- `PurchaseDialog`: Criar/editar compra
- `SendToFinancialDialog`: Solicitar NF

### 6.4 Produtos

**Página:** `/products`  
**Arquivo:** `src/pages/Products.tsx`

**Funcionalidades:**
- Catálogo de produtos
- Tipos: curso, ebook, mentoria, assinatura, outro
- Gerenciamento de ofertas Hotmart
- Upload de imagens
- Processamento retroativo de base

**Hooks utilizados:**
- `useProducts`: CRUD de produtos
- `useProductOffers`: Ofertas Hotmart
- `useProcessExistingProducts`: Reprocessamento

### 6.5 Campanhas

**Página:** `/campaigns`  
**Arquivo:** `src/pages/Campaigns.tsx`

**Funcionalidades:**
- Lista de campanhas com cards visuais
- Metas por campanha (leads, vendas, receita)
- Código de tracking pixel
- Associação com produtos
- ROI e ROAS automáticos

**Componentes principais:**
- `CampaignDialog`: Criar/editar campanha
- `CampaignGoalsSection`: Seção de metas
- `CampaignGoalDialog`: Criar/editar meta
- `CampaignGoalProgress`: Barra de progresso

### 6.6 CRM Pipeline

**Página:** `/crm`  
**Arquivo:** `src/pages/CRM.tsx`

**Funcionalidades:**
- Kanban com drag-and-drop
- Filtro por produto
- Cards com info essencial do lead
- Contadores por coluna
- Atualização de status em tempo real

**Hooks utilizados:**
- `useCRMPipeline`: Dados do pipeline
- `useLeads`: Atualização de status

### 6.7 Financeiro

**Página:** `/financial`  
**Arquivo:** `src/pages/Financial.tsx`

**Funcionalidades:**
- Lista de solicitações de NF
- Workflow: pending → sent → issued
- Filtros por mês e produto
- Exportação para contador
- Métricas financeiras

**Hooks utilizados:**
- `useFinancialMetrics`: Métricas de receita
- `useInvoiceRequests`: Solicitações de NF

### 6.8 Relatórios Facebook Ads

**Página:** `/advanced-reports`  
**Arquivo:** `src/pages/AdvancedReports.tsx`

**Funcionalidades:**
- Tabela hierárquica (Campanha → Adset → Ad)
- Filtros por campanha, adset, ad, status
- Métricas: impressões, cliques, gastos, CTR, CPM, CPC
- Gráficos de performance temporal
- Sincronização automática

**Hooks utilizados:**
- `useFacebookAdsHierarchicalReports`: Dados hierárquicos
- `useFacebookCampaigns`: Campanhas FB
- `useFacebookAdsets`: Conjuntos FB
- `useFacebookAds`: Anúncios FB

### 6.9 Pesquisas MQL

**Página:** `/surveys`  
**Arquivo:** `src/pages/Surveys.tsx`

**Funcionalidades:**
- Criação de pesquisas
- Importação de respostas (CSV/Google Sheets)
- Scoring dinâmico de leads
- Analytics com gráficos
- Ranking de leads qualificados
- Análise de padrões por IA

**Componentes principais:**
- `SurveyDialog`: Criar/editar pesquisa
- `SurveyAnalyticsDashboard`: Dashboard completo
- `SurveyChartsGrid`: Gráficos de distribuição
- `SurveyRankingTable`: Ranking de leads
- `SurveyPatternsAnalysis`: Análise IA

### 6.10 Assistente IA

**Página:** `/ai-assistant`  
**Arquivo:** `src/pages/AIAssistant.tsx`

**Funcionalidades:**
- Chat com IA (Lovable AI/Gemini)
- Análise de dados em linguagem natural
- Sugestões de otimização
- Processamento de planilhas

**Hooks utilizados:**
- `useAIAssistant`: Gerenciamento do chat

---

## 7. Edge Functions (Backend)

### 7.1 Visão Geral

| Função | Endpoint | JWT | Descrição |
|--------|----------|-----|-----------|
| `webhook-hotmart` | `/webhook-hotmart` | ❌ | Recebe webhooks Hotmart |
| `webhook-manychat` | `/webhook-manychat` | ❌ | Recebe webhooks ManyChat |
| `webhook-n8n` | `/webhook-n8n` | ❌ | Recebe webhooks N8N |
| `webhook-tracking-pixel` | `/webhook-tracking-pixel` | ❌ | Recebe dados do pixel |
| `sync-facebook-ads` | `/sync-facebook-ads` | ✅ | Sincroniza Facebook Ads |
| `test-facebook-connection` | `/test-facebook-connection` | ✅ | Testa conexão FB |
| `unify-leads` | `/unify-leads` | ✅ | Unifica leads duplicados |
| `ai-assistant` | `/ai-assistant` | ❌ | Chat com IA |

### 7.2 webhook-hotmart

Processa eventos de compra da Hotmart.

**Endpoint:** `POST /functions/v1/webhook-hotmart`

**Headers esperados:**
```
x-hotmart-hottok: <token_validacao>
Content-Type: application/json
```

**Payload de entrada (v2.0.0):**
```json
{
  "event": "PURCHASE_APPROVED",
  "data": {
    "buyer": {
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": {
        "area_code": "11",
        "number": "999999999"
      },
      "document": "12345678900",
      "address": {
        "zipcode": "01310-100",
        "address": "Av Paulista",
        "number": "1000",
        "complement": "Sala 1",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "country": "Brasil"
      }
    },
    "purchase": {
      "transaction": "HP123456789",
      "order_date": 1702425600000,
      "approved_date": 1702425600000,
      "payment": {
        "type": "CREDIT_CARD",
        "installments_number": 12
      },
      "price": {
        "value": 997.00,
        "currency_value": "BRL"
      },
      "offer": {
        "code": "abc123xyz"
      },
      "is_subscription": false,
      "subscription": {
        "subscriber": {
          "code": null
        }
      }
    },
    "product": {
      "name": "Curso Completo",
      "id": 123456
    },
    "commissions": [
      {
        "source": "MARKETPLACE",
        "value": 99.70,
        "currency_value": "BRL"
      },
      {
        "source": "PRODUCER",
        "value": 897.30,
        "currency_value": "BRL"
      }
    ]
  }
}
```

**Fluxo de processamento:**
1. Valida token `x-hotmart-hottok`
2. Loga webhook em `webhook_logs`
3. Busca lead existente (email/phone/cpf)
4. Cria ou atualiza lead
5. Busca `product_slug` via `product_offers`
6. Cria purchase com valores corretos
7. Atualiza CRM status para "comprador"
8. Cria evento em `lead_events`
9. Trigger cria `invoice_request`

**Resposta de sucesso:**
```json
{
  "success": true,
  "lead_id": "uuid-do-lead",
  "purchase_id": "uuid-da-compra"
}
```

### 7.3 sync-facebook-ads

Sincroniza dados do Facebook Ads API.

**Endpoint:** `POST /functions/v1/sync-facebook-ads`

**Headers:**
```
Authorization: Bearer <supabase_token>
```

**Fluxo:**
1. Busca config ativa em `fb_ads_config`
2. Fetch campanhas do FB API
3. Fetch adsets para cada campanha
4. Fetch ads para cada adset
5. Fetch insights (métricas) para cada ad
6. Upsert em `fb_campaigns`, `fb_adsets`, `fb_ads`, `fb_metrics`
7. Atualiza `last_sync_at`

**Endpoints FB usados:**
- `GET /act_{account_id}/campaigns`
- `GET /act_{account_id}/adsets`
- `GET /act_{account_id}/ads`
- `GET /{ad_id}/insights`

### 7.4 ai-assistant

Processa mensagens para o assistente IA.

**Endpoint:** `POST /functions/v1/ai-assistant`

**Payload:**
```json
{
  "messages": [
    {"role": "user", "content": "Quantas vendas tivemos este mês?"}
  ]
}
```

**Processo:**
1. Coleta contexto do banco (leads, purchases, campaigns, etc.)
2. Monta system prompt com dados relevantes
3. Envia para Lovable AI (Gemini)
4. Retorna stream de resposta

### 7.5 Configuração (config.toml)

```toml
project_id = "txrgvcpaeavujrmdwxtl"

[functions.webhook-hotmart]
verify_jwt = false

[functions.webhook-manychat]
verify_jwt = false

[functions.webhook-n8n]
verify_jwt = false

[functions.sync-facebook-ads]
verify_jwt = true

[functions.ai-assistant]
verify_jwt = false

[functions.webhook-tracking-pixel]
verify_jwt = false

[functions.unify-leads]
verify_jwt = true

[functions.test-facebook-connection]
verify_jwt = true
```

---

## 8. Hooks Customizados

### 8.1 Tabela de Referência

| Hook | Arquivo | Propósito |
|------|---------|-----------|
| `useAuth` | `contexts/AuthContext.tsx` | Autenticação |
| `useUserRole` | `hooks/useUserRole.ts` | Role do usuário |
| `useLeads` | `hooks/useLeads.ts` | CRUD leads |
| `useProducts` | `hooks/useProducts.ts` | CRUD produtos |
| `useCampaigns` | `hooks/useCampaigns.ts` | CRUD campanhas |
| `usePurchases` | `hooks/usePurchases.ts` | CRUD compras |
| `useTags` | `hooks/useTags.ts` | CRUD tags |
| `useSurveys` | `hooks/useSurveys.ts` | CRUD pesquisas |
| `useDashboardMetrics` | `hooks/useDashboardMetrics.ts` | Métricas dashboard |
| `useFinancialMetrics` | `hooks/useFinancialMetrics.ts` | Métricas financeiras |
| `useCRMPipeline` | `hooks/useCRMPipeline.ts` | Pipeline CRM |
| `useFacebookAdsHierarchicalReports` | `hooks/useFacebookAdsHierarchicalReports.ts` | Relatórios FB |
| `useImportLeads` | `hooks/useImportLeads.ts` | Importação |
| `useBulkTagOperations` | `hooks/useBulkTagOperations.ts` | Operações em massa |
| `useAIAssistant` | `hooks/useAIAssistant.ts` | Chat IA |

### 8.2 Padrões Comuns

**Hook de CRUD básico:**

```typescript
export function useProducts() {
  const queryClient = useQueryClient();
  
  // Query: buscar produtos
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  // Mutation: criar produto
  const createMutation = useMutation({
    mutationFn: async (newProduct: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar produto');
      console.error(error);
    },
  });
  
  // Mutation: atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado!');
    },
  });
  
  // Mutation: deletar
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido!');
    },
  });
  
  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    error: productsQuery.error,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

### 8.3 Hook com Filtros

```typescript
interface UseLeadsOptions {
  period?: string;
  productSlug?: string;
  source?: string;
  tagIds?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useLeads(options: UseLeadsOptions = {}) {
  const {
    period = '30d',
    productSlug,
    source,
    tagIds = [],
    search,
    page = 1,
    pageSize = 20,
  } = options;
  
  return useQuery({
    queryKey: ['leads', period, productSlug, source, tagIds, search, page],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, lead_tags(tag_id, tags(*))', { count: 'exact' });
      
      // Filtro de período
      if (period !== 'all') {
        const startDate = getStartDate(period);
        query = query.gte('created_at', startDate.toISOString());
      }
      
      // Filtro de produto (via purchases)
      if (productSlug) {
        const { data: leadIds } = await supabase
          .from('purchases')
          .select('lead_id')
          .eq('product_slug', productSlug)
          .eq('status', 'approved');
        
        if (leadIds?.length) {
          query = query.in('lead_id', leadIds.map(l => l.lead_id));
        }
      }
      
      // Filtro de origem
      if (source) {
        query = query.eq('source', source);
      }
      
      // Busca textual
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }
      
      // Paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      // Ordenação
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { data, count };
    },
  });
}
```

---

## 9. Design System

### 9.1 Cores (CSS Variables)

```css
/* src/index.css */

:root {
  /* Cores base */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  
  /* Cards e elementos */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  
  /* Cores primárias (laranja) */
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  
  /* Cores secundárias */
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  
  /* Estados */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  
  /* Bordas */
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 24 95% 53%;
  
  /* Gráficos */
  --chart-1: 217 91% 60%;
  --chart-2: 142 71% 45%;
  --chart-3: 262 83% 58%;
  --chart-4: 38 92% 50%;
  --chart-5: 0 84% 60%;
  
  /* Raios e sombras */
  --radius: 0.75rem;
}

.dark {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 98%;
  --primary: 24 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
}
```

### 9.2 Componentes UI

#### Button (variantes)

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

#### Card (variantes)

```typescript
const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        glass: "bg-background/80 backdrop-blur-md border-border/50",
        gradient: "bg-gradient-to-br from-card to-card/80",
        glow: "shadow-lg shadow-primary/10 border-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```

### 9.3 Responsividade

O sistema segue abordagem **mobile-first**:

```typescript
// Breakpoints Tailwind
// sm: 640px  (tablets pequenos)
// md: 768px  (tablets)
// lg: 1024px (desktop)
// xl: 1280px (desktop grande)
// 2xl: 1536px (ultra wide)

// Exemplo de classe responsiva
<div className="
  p-4          /* Mobile: padding 16px */
  md:p-6       /* Tablet: padding 24px */
  lg:p-8       /* Desktop: padding 32px */
  
  grid
  grid-cols-1  /* Mobile: 1 coluna */
  md:grid-cols-2  /* Tablet: 2 colunas */
  lg:grid-cols-3  /* Desktop: 3 colunas */
">
```

### 9.4 Acessibilidade

```typescript
// Skip links para navegação por teclado
<SkipLink href="#main-content">
  Pular para conteúdo principal
</SkipLink>

// Labels visuais ocultos mas acessíveis
<VisuallyHidden>
  <label htmlFor="search">Buscar leads</label>
</VisuallyHidden>

// Focus ring visível
<button className="focus-visible:ring-2 focus-visible:ring-primary">
  Ação
</button>

// ARIA labels em ícones
<button aria-label="Fechar modal">
  <X className="h-4 w-4" />
</button>
```

---

## 10. Integrações Externas

### 10.1 Hotmart

**Configuração:**
1. Acessar Hotmart > Configurações > Webhooks
2. Adicionar URL: `https://txrgvcpaeavujrmdwxtl.supabase.co/functions/v1/webhook-hotmart`
3. Selecionar eventos: `PURCHASE_APPROVED`, `PURCHASE_REFUNDED`, etc.
4. Copiar token de validação (`hottok`)
5. Adicionar no sistema como variável de ambiente

**Eventos suportados:**
- `PURCHASE_APPROVED`: Compra aprovada
- `PURCHASE_REFUNDED`: Reembolso
- `PURCHASE_CANCELED`: Cancelamento
- `SUBSCRIPTION_CANCELLATION`: Cancelamento assinatura

### 10.2 Facebook Ads API

**Configuração:**
1. Criar App no Facebook Developers
2. Obter Access Token com permissões: `ads_read`, `ads_management`
3. Copiar Ad Account ID (formato: `act_XXXXXXXXX`)
4. Adicionar em Integrações > Facebook Ads

**Dados sincronizados:**
- Campanhas (nome, status, objetivo, orçamento)
- Conjuntos de anúncios (targeting, otimização)
- Anúncios (criativo, status)
- Métricas (impressões, cliques, gastos, CTR, CPM, CPC)

### 10.3 ManyChat

**Configuração:**
1. Em ManyChat > Settings > Webhooks
2. Adicionar URL: `https://txrgvcpaeavujrmdwxtl.supabase.co/functions/v1/webhook-manychat`
3. Selecionar eventos desejados

**Dados capturados:**
- Nome do assinante
- Email
- Telefone
- Tags do ManyChat
- Custom fields

### 10.4 N8N

**Configuração:**
1. Em N8N, criar workflow
2. Usar nó HTTP Request (POST)
3. URL: `https://txrgvcpaeavujrmdwxtl.supabase.co/functions/v1/webhook-n8n`
4. Enviar dados no corpo

**Payload esperado:**
```json
{
  "event_type": "lead_captured",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "utm_source": "facebook",
  "utm_campaign": "lancamento"
}
```

---

## 11. Guia de Replicação

### 11.1 Pré-requisitos

- Node.js 18+ instalado
- Conta no Lovable (https://lovable.dev)
- Git configurado

### 11.2 Passo 1: Criar Projeto

1. Acessar https://lovable.dev
2. Criar novo projeto
3. Habilitar Lovable Cloud (backend)

### 11.3 Passo 2: Estrutura do Banco

Executar as seguintes migrations na ordem:

```sql
-- 1. Tabela de leads
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  zip_code TEXT,
  street TEXT,
  street_number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  region TEXT,
  crm_status TEXT DEFAULT 'lead',
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  project_slug TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de produtos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC DEFAULT 0,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de compras
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(lead_id),
  product_name TEXT NOT NULL,
  product_code TEXT,
  product_slug TEXT,
  value NUMERIC,
  gross_value NUMERIC,
  commission NUMERIC,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL,
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  transaction_id TEXT,
  platform TEXT,
  source TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  project_slug TEXT,
  is_recurring BOOLEAN DEFAULT false,
  subscription_id TEXT,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 4. Continuar com demais tabelas...
```

### 11.4 Passo 3: Configurar Auth

```sql
-- Criar enum de roles
CREATE TYPE app_role AS ENUM ('admin', 'commercial', 'financial', 'support');

-- Tabela de roles
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para novos usuários
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  
  IF new.email = 'seu-email-admin@email.com' THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (new.id, 'admin');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 11.5 Passo 4: Políticas RLS

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ... demais tabelas

-- Função auxiliar
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Políticas de exemplo
CREATE POLICY "Authenticated users can view leads"
  ON leads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage leads"
  ON leads FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### 11.6 Passo 5: Edge Functions

Criar pasta `supabase/functions/` com as funções:

```
supabase/functions/
├── webhook-hotmart/index.ts
├── webhook-manychat/index.ts
├── webhook-n8n/index.ts
├── sync-facebook-ads/index.ts
├── ai-assistant/index.ts
└── ...
```

### 11.7 Passo 6: Componentes Frontend

Seguir a estrutura de componentes documentada na Seção 3.

### 11.8 Checklist de Implementação

#### Módulo de Leads
- [ ] Criar tabela `leads`
- [ ] Criar tabela `lead_events`
- [ ] Criar tabela `lead_tags`
- [ ] Criar tabela `tags`
- [ ] Implementar `useLeads` hook
- [ ] Implementar página de lista
- [ ] Implementar página de perfil
- [ ] Implementar importação CSV
- [ ] Implementar exportação CSV

#### Módulo de Produtos
- [ ] Criar tabela `products`
- [ ] Criar tabela `product_offers`
- [ ] Implementar `useProducts` hook
- [ ] Implementar CRUD de produtos
- [ ] Implementar upload de imagem

#### Módulo de Campanhas
- [ ] Criar tabela `campaigns`
- [ ] Criar tabela `goals`
- [ ] Implementar `useCampaigns` hook
- [ ] Implementar CRUD de campanhas
- [ ] Implementar metas

#### Módulo CRM
- [ ] Implementar `useCRMPipeline` hook
- [ ] Implementar Kanban
- [ ] Implementar drag-and-drop
- [ ] Implementar filtros

#### Módulo Financeiro
- [ ] Criar tabela `purchases`
- [ ] Criar tabela `invoice_requests`
- [ ] Implementar trigger automático
- [ ] Implementar workflow de status
- [ ] Implementar exportação

#### Integrações
- [ ] Implementar webhook Hotmart
- [ ] Implementar webhook ManyChat
- [ ] Implementar webhook N8N
- [ ] Implementar sync Facebook Ads
- [ ] Implementar tracking pixel

---

## 12. Troubleshooting

### 12.1 Erros Comuns

#### "Row level security policy violation"
**Causa:** Política RLS bloqueando acesso.  
**Solução:** Verificar se usuário está autenticado e tem role correto.

```typescript
// Verificar autenticação
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// Verificar role
const { data: role } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single();
console.log('Role:', role);
```

#### Webhook não processa eventos
**Causa:** Token de validação incorreto ou payload incompatível.  
**Solução:**
1. Verificar logs em `webhook_logs`
2. Verificar token `x-hotmart-hottok`
3. Verificar estrutura do payload

#### Sync Facebook Ads falha
**Causa:** Token expirado ou permissões insuficientes.  
**Solução:**
1. Renovar Access Token
2. Verificar permissões: `ads_read`, `ads_management`
3. Testar conexão antes de sincronizar

### 12.2 Logs e Debug

```typescript
// Console logs no frontend
console.log('[useLeads]', data);

// Logs em Edge Functions
console.log('[webhook-hotmart] Payload:', JSON.stringify(payload));

// Query logs do Supabase
// Acessar via Lovable Cloud > Logs
```

---

## 13. Anexos

### 13.1 Exemplo de Payload Hotmart Completo

```json
{
  "event": "PURCHASE_APPROVED",
  "version": "2.0.0",
  "data": {
    "product": {
      "id": 123456,
      "name": "Curso Completo de Marketing Digital",
      "has_co_production": false
    },
    "buyer": {
      "name": "João Silva Santos",
      "email": "joao.silva@email.com",
      "phone": {
        "area_code": "11",
        "number": "999887766"
      },
      "document": "12345678900",
      "address": {
        "zipcode": "01310-100",
        "address": "Av. Paulista",
        "number": "1000",
        "complement": "Sala 1010",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "country": "Brasil"
      }
    },
    "purchase": {
      "transaction": "HP123456789012345",
      "order_date": 1702425600000,
      "approved_date": 1702425600000,
      "full_price": {
        "value": 997.00,
        "currency_value": "BRL"
      },
      "price": {
        "value": 997.00,
        "currency_value": "BRL"
      },
      "payment": {
        "type": "CREDIT_CARD",
        "installments_number": 12
      },
      "offer": {
        "code": "abc123xyz789"
      },
      "is_subscription": false,
      "subscription": {
        "subscriber": {
          "code": null
        }
      },
      "tracking": {
        "source_sck": "fb_123456789",
        "source": "FACEBOOK",
        "utm_source": "facebook",
        "utm_medium": "cpc",
        "utm_campaign": "lancamento_maio",
        "utm_content": "video_1",
        "utm_term": "marketing_digital"
      }
    },
    "commissions": [
      {
        "source": "MARKETPLACE",
        "value": 99.70,
        "currency_value": "BRL"
      },
      {
        "source": "PRODUCER",
        "value": 897.30,
        "currency_value": "BRL"
      }
    ]
  }
}
```

### 13.2 SQL Completo de Criação

[Disponível em migrations do projeto]

### 13.3 Constantes do Sistema

```typescript
// src/lib/constants.ts

// Status CRM
export const CRM_STATUS = {
  lead: 'lead',
  engajado: 'engajado',
  aquecido: 'aquecido',
  carrinho: 'carrinho',
  comprador: 'comprador',
  perdido: 'perdido',
} as const;

// Status de compra
export const PURCHASE_STATUS = {
  approved: 'approved',
  pending: 'pending',
  declined: 'declined',
  refunded: 'refunded',
} as const;

// Métodos de pagamento
export const PAYMENT_METHODS = {
  credit_card: 'credit_card',
  boleto: 'boleto',
  pix: 'pix',
} as const;

// Tipos de produto
export const PRODUCT_TYPES = {
  curso: 'curso',
  ebook: 'ebook',
  mentoria: 'mentoria',
  assinatura: 'assinatura',
  outro: 'outro',
} as const;
```

---

## 📞 Suporte

- **Documentação Lovable:** https://docs.lovable.dev
- **Documentação Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

---

*Documento gerado automaticamente - Leads Intelligence Platform v1.0.0*
