

# Corrigir exibicao de numeros e conteudos cortados

## Problema
- Os valores numericos nos cards de metricas estao sendo cortados pela classe `truncate` (que aplica `text-overflow: ellipsis`)
- Em telas menores, o grid de 6 colunas comprime demais os cards
- Tabelas e listas podem nao ter scroll horizontal adequado

## Solucao

### 1. MetricCard - Remover truncamento de valores
**Arquivo**: `src/components/MetricCard.tsx`
- Remover a classe `truncate` do valor numerico (linha 98)
- Permitir que o texto quebre naturalmente ou reduza o tamanho da fonte em telas pequenas
- Usar `text-sm md:text-2xl` para valores grandes caberem melhor no mobile
- Adicionar `break-all` como fallback para valores monetarios muito longos

### 2. Dashboard - Ajustar grid de metricas
**Arquivo**: `src/pages/Dashboard.tsx`
- Alterar o grid de `grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` para `grid-cols-2 md:grid-cols-3 xl:grid-cols-6`
- Garantir que cada card tenha espaco minimo suficiente para exibir valores como `R$ 47.500,00`

### 3. Leads - Garantir scroll horizontal na tabela
**Arquivo**: `src/pages/Leads.tsx`
- Ja possui `overflow-x-auto` no container da tabela (OK)
- Adicionar classe `scrollbar-thin` para visibilidade da barra de rolagem

### 4. Paginas com tabelas/listas - Adicionar scroll horizontal visivel
Verificar e adicionar `overflow-x-auto scrollbar-thin` nos containers de tabela das seguintes paginas:
- `src/pages/Financial.tsx`
- `src/pages/Products.tsx`
- `src/pages/Campaigns.tsx`
- `src/pages/Surveys.tsx`

### 5. Leads Summary Cards - Mesma correcao
**Arquivo**: `src/pages/Leads.tsx`
- Os cards de resumo (linhas 205-245) tambem podem cortar valores grandes
- Remover restricoes de tamanho que causam truncamento

## Resumo das alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/MetricCard.tsx` | Remover `truncate`, ajustar tamanho de fonte responsivo |
| `src/pages/Dashboard.tsx` | Ajustar breakpoints do grid de metricas |
| `src/pages/Leads.tsx` | Adicionar `scrollbar-thin` na tabela |
| `src/pages/Financial.tsx` | Adicionar scroll horizontal com barra visivel |
| `src/pages/Products.tsx` | Adicionar scroll horizontal com barra visivel |
| `src/pages/Campaigns.tsx` | Adicionar scroll horizontal com barra visivel |
| `src/pages/Surveys.tsx` | Adicionar scroll horizontal com barra visivel |

## Detalhes tecnicos

A classe `truncate` do Tailwind aplica `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` que corta qualquer valor que exceda a largura do container. A solucao e substituir por `break-words` ou simplesmente remover a restricao, permitindo que o valor se ajuste naturalmente.

Para tabelas com muitas colunas, a barra de rolagem horizontal (`scrollbar-thin`) fica visivel para que o usuario saiba que pode arrastar para ver mais conteudo.

