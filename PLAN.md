# Plano: Simplificação do Sistema + Correção de Cor

## Parte 1: Simplificação da Navegação

### Estado Atual (14 itens no sidebar para admin)
```
PRINCIPAL (5)       → Dashboard, Leads, CRM, Relatórios, Rel. Tráfego
MARKETING (2)       → Campanhas, Tracking
ANÁLISES (2)        → Produtos, Financeiro
FERRAMENTAS (3)     → Assistente IA, Integrações, Logs Webhooks
ADMINISTRAÇÃO (1)   → Configurações
```

### Proposta Simplificada (9 itens, 36% menos)
```
PRINCIPAL (3)       → Dashboard, Leads, CRM
RELATÓRIOS (1)      → Relatórios (com abas: Geral | Tráfego Pago)
MARKETING (1)       → Campanhas (com abas: Campanhas | Rastreamento)
NEGÓCIOS (2)        → Produtos, Financeiro
SISTEMA (2)         → Integrações (com abas: Conexões | Logs), Configurações
```
O Assistente IA vira botão flutuante (já existe o componente).

### Detalhamento das Consolidações

#### 1. Relatórios + Rel. Tráfego → "Relatórios" com abas
- **Aba "Geral"**: conteúdo atual do Reports.tsx (métricas unificadas, campanhas, produtos)
- **Aba "Tráfego Pago"**: conteúdo atual do AdvancedReports.tsx (Facebook Ads hierárquico)
- Rota: `/reports` (remove `/advanced-reports`)
- Arquivos: modificar Reports.tsx, mover conteúdo do AdvancedReports.tsx como componente tab

#### 2. Campanhas + Tracking → "Campanhas" com abas
- **Aba "Campanhas"**: gestão de campanhas atual
- **Aba "Rastreamento"**: geradores de UTM, pixel, WhatsApp links
- Rota: `/campaigns` (remove `/tracking`)

#### 3. Integrações + Logs Webhooks → "Integrações" com abas
- **Aba "Conexões"**: Facebook Ads config + URLs de webhooks
- **Aba "Logs"**: tabela de logs de webhooks com filtros
- Rota: `/integrations` (remove `/webhook-logs`)

#### 4. Assistente IA → Botão flutuante
- Remover rota `/ai-assistant`
- O componente `<AIAssistant />` já é renderizado como floating button no DashboardLayout
- Remover página dedicada, manter apenas o floating

### Arquivos a Modificar
- `src/components/DashboardLayout.tsx` — nova estrutura de navegação
- `src/components/BottomNav.tsx` — atualizar nav mobile
- `src/lib/permissions.ts` — remover rotas extintas
- `src/App.tsx` — remover rotas e lazy imports
- `src/pages/Reports.tsx` — adicionar tab "Tráfego Pago"
- `src/pages/Campaigns.tsx` — adicionar tab "Rastreamento"
- `src/pages/Integrations.tsx` — adicionar tab "Logs"

### Arquivos a Deletar (código movido para tabs)
- ~~`src/pages/AdvancedReports.tsx`~~ — manter arquivo mas não terá mais rota dedicada
- ~~`src/pages/Tracking.tsx`~~ — idem
- ~~`src/pages/WebhookLogs.tsx`~~ — idem
- ~~`src/pages/AIAssistant.tsx`~~ — idem

---

## Parte 2: Correção da Cor Verde

### Problema
- `#CCFF00` (acid neon) no dark mode: saturação 100%, brilho máximo = agressivo
- `hsl(142,71%,45%)` no light mode: saturação 71% = muito vibrante para uso repetido
- Aparece em 75+ locais no dark mode, criando fadiga visual

### Proposta: Verde Menta/Esmeralda (mais suave, menos saturado)

| Contexto | Antes | Depois |
|----------|-------|--------|
| **Texto light** | `hsl(142,71%,45%)` | `hsl(160,55%,40%)` |
| **Texto dark** | `#CCFF00` | `hsl(160,50%,58%)` → `#52C9A0` |
| **Fundo light** | `rgba(34,197,94,0.12)` | `rgba(16,185,129,0.10)` |
| **Fundo dark** | `rgba(204,255,0,0.08)` | `rgba(82,201,160,0.08)` |
| **Borda light** | `rgba(34,197,94,0.20)` | `rgba(16,185,129,0.20)` |
| **Borda dark** | `rgba(204,255,0,0.15)` | `rgba(82,201,160,0.15)` |
| **Chart green light** | `142 71% 45%` | `160 55% 40%` |
| **Chart green dark** | `72 100% 50%` (#CCFF00) | `160 50% 58%` (#52C9A0) |

### Por que esmeralda/menta?
1. **Hue 160°** em vez de 142° — mais frio/azulado, naturalmente calmante
2. **Saturação 50-55%** em vez de 71-100% — vibrante mas não agressivo
3. **Mantém semântica** — verde = sucesso/dinheiro, reconhecível imediatamente
4. **Contraste adequado** — 4.5:1+ ratio em ambos os modos

### Locais de mudança
- `src/index.css` — variável `--chart-green`
- `src/components/ui/badge.tsx` — variant `success`
- `src/components/ui/button.tsx` — variant `success`
- `src/components/ui/progress.tsx` — gradiente dark
- ~30 arquivos com classes inline de cor verde (substituição em lote)
