# Sistema de Unificação Inteligente de Leads

## Visão Geral

O sistema de unificação de leads detecta automaticamente duplicatas usando múltiplas regras de correspondência e permite unificação automática ou revisão manual, mantendo histórico completo de todas as operações.

## Regras de Unificação

### 1. Telefone (Forte) 🟢
- **Confiança**: Alta
- **Critério**: Telefones idênticos após normalização (apenas dígitos)
- **Ação**: Unificação automática recomendada
- **Exemplo**: `(11) 98765-4321` = `11987654321` = `+55 11 98765-4321`

### 2. E-mail (Forte) 🔵
- **Confiança**: Alta
- **Critério**: E-mails idênticos após normalização (lowercase, trim)
- **Ação**: Unificação automática recomendada
- **Exemplo**: `João@EMAIL.com` = `joao@email.com` = ` joao@email.com `

### 3. CPF (Forte) 🟣
- **Confiança**: Alta
- **Critério**: CPFs idênticos após normalização (apenas dígitos)
- **Ação**: Unificação automática recomendada
- **Exemplo**: `123.456.789-00` = `12345678900`

### 4. Nome + 4 Últimos Dígitos do Telefone (Fraco) 🟡
- **Confiança**: Baixa
- **Critério**: Nome semelhante + últimos 4 dígitos do telefone iguais
- **Ação**: **Sempre requer revisão manual**
- **Exemplo**: `João Silva` + telefone terminado em `4321`

## Processo de Unificação

### 1. Detecção de Duplicatas

O sistema busca automaticamente por leads duplicados quando:
- Um novo lead é criado via webhook
- O usuário clica no botão "Unificar" na página de leads
- Uma atualização de lead é realizada

### 2. Unificação Automática

Quando `auto_merge = true`:

1. **Identificação do Lead Principal (Master)**
   - O lead mais antigo (primeiro `created_at`) torna-se o master
   - Todos os leads duplicados são mesclados nele

2. **Preenchimento de Campos Vazios**
   - Campos vazios no lead principal são preenchidos com dados dos duplicados
   - Exemplo: Se master não tem e-mail mas duplicata tem, e-mail é copiado

3. **Transferência de Relacionamentos**
   - Todos os `lead_events` são transferidos para o master
   - Todas as `purchases` são transferidas para o master
   - Histórico completo é preservado

4. **Detecção de Conflitos**
   - Campos com valores **diferentes e não vazios** geram conflito
   - Conflitos são registrados no log para revisão manual
   - Exemplo: Master tem email `joao@email.com`, duplicata tem `joao.silva@email.com`

5. **Registro de Log**
   - Cada unificação gera um registro em `lead_merge_logs`
   - Log contém: lead principal, lead mesclado, motivo, dados, conflitos
   - Logs sem conflitos são marcados como `reviewed = true` automaticamente

6. **Exclusão do Duplicado**
   - Lead duplicado é excluído permanentemente após unificação
   - Todos os dados foram transferidos para o master

### 3. Revisão Manual

Quando `auto_merge = false` ou há conflitos:

1. Sistema retorna lista de duplicatas encontradas
2. Usuário revisa cada correspondência no dialog
3. Usuário decide se aprova ou rejeita cada unificação
4. Logs são marcados como `reviewed = true` após revisão

## Estrutura do Banco de Dados

### Tabela `lead_merge_logs`

```sql
CREATE TABLE lead_merge_logs (
  id uuid PRIMARY KEY,
  master_lead_id uuid REFERENCES leads(lead_id),  -- Lead que permaneceu
  merged_lead_id uuid,                            -- Lead que foi mesclado (UUID preservado)
  merge_reason text,                              -- 'phone', 'email', 'cpf', 'name_phone_partial'
  merged_data jsonb,                              -- Dados completos do lead mesclado
  conflict_fields text[],                         -- Campos que tinham valores diferentes
  reviewed boolean DEFAULT false,                 -- Se foi revisado manualmente
  reviewed_by uuid,                               -- Quem revisou
  reviewed_at timestamptz,                        -- Quando foi revisado
  created_at timestamptz DEFAULT now()
);
```

### Funções de Normalização

```sql
-- Normaliza telefone (remove caracteres especiais)
normalize_phone(phone_input text) RETURNS text

-- Normaliza email (lowercase, trim)
normalize_email(email_input text) RETURNS text
```

## API da Edge Function

### Endpoint: `unify-leads`

#### Request

```json
{
  "lead_id": "uuid-do-lead-principal",
  "auto_merge": false  // true para unificação automática, false apenas para listar duplicatas
}
```

#### Response (auto_merge = false)

```json
{
  "success": true,
  "message": "2 duplicata(s) encontrada(s) - revisão manual necessária",
  "duplicates": [
    {
      "lead_id": "uuid-da-duplicata",
      "name": "João Silva",
      "email": "joao@email.com",
      "phone": "11987654321",
      "cpf": "12345678900",
      "reason": "phone",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Response (auto_merge = true)

```json
{
  "success": true,
  "message": "2 lead(s) unificado(s) com sucesso",
  "master_lead_id": "uuid-do-master",
  "merged_lead_ids": ["uuid-1", "uuid-2"],
  "merge_logs": [
    {
      "id": "log-uuid",
      "master_lead_id": "master-uuid",
      "merged_lead_id": "merged-uuid",
      "merge_reason": "phone",
      "conflict_fields": ["email"],
      "reviewed": false
    }
  ]
}
```

## Interface do Usuário

### 1. Página de Leads

- Botão "Unificar" (ícone GitMerge) ao lado de cada lead
- Clique abre o `UnificationReviewDialog`
- Dialog mostra todas as duplicatas encontradas com suas correspondências

### 2. Dialog de Revisão (`UnificationReviewDialog`)

**Elementos:**
- Badge colorido por tipo de correspondência
- Alerta para correspondências fracas (nome + 4 dígitos)
- Cards com dados de cada duplicata
- Resumo de quantos leads serão unificados
- Botões: Cancelar | Unificar Leads

### 3. Perfil do Lead - Timeline de Unificações

**Componente `MergeLogsTimeline`:**
- Listagem cronológica de todas as unificações
- Timeline visual com indicadores de status (verde = revisado, amarelo = pendente)
- Badges por tipo de correspondência
- Alertas de conflitos quando existirem
- Dados completos do lead mesclado
- Botão "Aprovar" para logs pendentes
- Data e hora de cada operação

## Hooks React

### `useCheckDuplicates(leadId)`

Busca duplicatas sem realizar unificação:

```tsx
const { data, isLoading } = useCheckDuplicates(leadId);

// data.duplicates = array de leads duplicados
```

### `useUnifyLeads()`

Realiza unificação automática:

```tsx
const unifyMutation = useUnifyLeads();

await unifyMutation.mutateAsync({
  leadId: "uuid-do-lead",
  autoMerge: true
});
```

### `useMergeLogs(masterLeadId)`

Busca histórico de unificações de um lead:

```tsx
const { data: logs } = useMergeLogs(leadId);
```

### `useReviewMerge()`

Marca um log como revisado:

```tsx
const reviewMutation = useReviewMerge();

await reviewMutation.mutateAsync({
  logId: "uuid-do-log",
  reviewed: true
});
```

## Fluxo Completo de Uso

### Cenário 1: Unificação Manual

1. Usuário acessa a página de Leads
2. Clica no botão "Unificar" (GitMerge) ao lado de um lead
3. Sistema busca duplicatas e abre dialog
4. Dialog exibe todas as correspondências encontradas
5. Se houver correspondências fracas, alerta é exibido
6. Usuário revisa e clica em "Unificar Leads"
7. Sistema unifica automaticamente e registra logs
8. Campos vazios são preenchidos, conflitos são registrados
9. Toast de sucesso é exibido
10. Leads duplicados são removidos

### Cenário 2: Revisão de Conflitos

1. Usuário acessa perfil do lead
2. Vai para aba "Timeline"
3. Rola até seção "Histórico de Unificações"
4. Vê logs com status "Pendente" e alertas de conflito
5. Revisa dados do lead mesclado
6. Clica em "Aprovar" para confirmar que revisou
7. Log é marcado como `reviewed = true`

### Cenário 3: Webhook Automático (Futuro)

1. Webhook recebe novo lead via Hotmart/ManyChat/N8N
2. Sistema cria o lead normalmente
3. Edge function `unify-leads` é chamada automaticamente
4. Se duplicatas forem encontradas por telefone/email/CPF:
   - Unificação automática é realizada
   - Log é criado
   - Se houver conflitos, log fica pendente para revisão
5. Se apenas correspondência fraca (nome+4 dígitos):
   - Não unifica automaticamente
   - Admin recebe notificação para revisar

## Segurança

- **RLS Policies**: Apenas admins podem ver e gerenciar logs de unificação
- **Auditoria**: Todos os logs preservam dados completos do lead mesclado
- **Reversibilidade**: Dados do lead mesclado são preservados no log (JSON)
- **Validação**: Funções de normalização usam `SECURITY DEFINER` e `SET search_path`

## Boas Práticas

### ✅ Fazer

- Sempre revisar logs com conflitos
- Usar unificação automática para correspondências fortes (telefone, email, CPF)
- Manter histórico de logs para auditoria
- Configurar webhook automático para unificação em tempo real

### ❌ Não Fazer

- Não unificar automaticamente correspondências fracas (nome+4 dígitos)
- Não deletar logs de unificação (são histórico)
- Não confiar apenas em correspondência de nome
- Não ignorar conflitos sem revisão

## Exemplos de Código

### Unificar Lead Manualmente

```tsx
import { useUnifyLeads } from "@/hooks/useLeadUnification";

function MyComponent() {
  const unifyMutation = useUnifyLeads();

  const handleUnify = async (leadId: string) => {
    await unifyMutation.mutateAsync({
      leadId,
      autoMerge: true
    });
  };

  return (
    <Button onClick={() => handleUnify("lead-uuid")}>
      Unificar
    </Button>
  );
}
```

### Exibir Timeline de Unificações

```tsx
import { MergeLogsTimeline } from "@/components/leads/MergeLogsTimeline";

function LeadProfilePage({ leadId }) {
  return (
    <div>
      <MergeLogsTimeline leadId={leadId} />
    </div>
  );
}
```

### Verificar Duplicatas Sem Unificar

```tsx
import { useCheckDuplicates } from "@/hooks/useLeadUnification";

function DuplicateChecker({ leadId }) {
  const { data, isLoading } = useCheckDuplicates(leadId);

  if (isLoading) return <div>Buscando...</div>;

  return (
    <div>
      {data?.duplicates?.map(dup => (
        <div key={dup.lead_id}>
          {dup.name} - Correspondência: {dup.reason}
        </div>
      ))}
    </div>
  );
}
```

## Roadmap

### Próximas Melhorias

- [ ] Unificação automática via webhook em tempo real
- [ ] Dashboard de duplicatas pendentes de revisão
- [ ] Notificações para admins quando houver conflitos
- [ ] Regra adicional: Nome completo + Email parcial
- [ ] Desfazer unificação (restaurar lead mesclado)
- [ ] Unificação em lote (múltiplos leads de uma vez)
- [ ] Machine Learning para sugerir unificações
- [ ] API para integrações externas verificarem duplicatas

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs da edge function `unify-leads`
2. Consulte a tabela `lead_merge_logs` para histórico
3. Revise políticas RLS se houver problemas de acesso
4. Teste funções de normalização com `SELECT normalize_phone('...')`
