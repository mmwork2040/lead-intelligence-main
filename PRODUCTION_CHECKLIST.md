# ✅ Checklist para Produção

Este checklist garante que o sistema está pronto para uso em ambiente de produção com segurança e estabilidade.

## 🔐 Segurança e Autenticação

- [ ] **Desabilitar Modo Desenvolvimento**
  - Alterar `VITE_DEV_MODE=false` no arquivo `.env`
  - Rebuildar o projeto após a alteração

- [ ] **Configurar Autenticação Supabase**
  - [ ] Desabilitar auto-confirm de emails (apenas para ambientes de teste)
  - [ ] Configurar Site URL no Supabase Auth
  - [ ] Adicionar Redirect URLs permitidas
  - [ ] Revisar rate limits de autenticação

- [ ] **Criar Primeiro Usuário Admin**
  - Opção 1: Via interface de cadastro + atribuir role manualmente no banco
  - Opção 2: Via migration SQL seed
  ```sql
  -- Exemplo de seed para primeiro admin
  -- Executar após criar usuário pela interface
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('uuid-do-usuario-aqui', 'admin');
  ```

## 🔒 Políticas de Segurança (RLS)

- [ ] **Executar Security Scan**
  - Usar ferramenta de security scan do Lovable Cloud
  - Revisar todos os warnings e errors
  - Corrigir issues críticos antes do deploy

- [ ] **Revisar Políticas RLS**
  - [ ] `leads` - Usuários veem apenas seus leads ou de sua equipe
  - [ ] `purchases` - Apenas financial e admin veem valores
  - [ ] `campaigns` - Controle de edição por role
  - [ ] `user_roles` - Apenas admins gerenciam
  - [ ] `system_config` - Apenas admins modificam

- [ ] **Testar Permissões por Role**
  - [ ] Criar usuário de teste para cada role
  - [ ] Verificar acessos corretos em cada módulo
  - [ ] Tentar acessos não permitidos

## 🎨 Branding e Identidade Visual

- [ ] **Personalizar Nome do Sistema**
  - [ ] `index.html` - title, meta tags
  - [ ] `src/components/DashboardLayout.tsx`
  - [ ] `src/components/MobileNav.tsx`
  - [ ] `src/components/LandingHero.tsx`
  - [ ] `src/pages/Auth.tsx`

- [ ] **Adicionar Logo Customizado**
  - Substituir gradiente placeholder por logo real
  - Formatos: SVG (ideal), PNG com fundo transparente
  - Tamanhos: 32x32px (favicon), 256x256px (og:image)

- [ ] **Ajustar Cores do Tema**
  - Revisar `src/index.css` (variáveis CSS)
  - Ajustar `tailwind.config.ts` se necessário
  - Testar dark mode e light mode

## 🔧 Configurações do Sistema

- [ ] **Variáveis de Ambiente**
  - Revisar todas as variáveis no `.env`
  - Confirmar URLs de produção
  - Verificar secrets configurados

- [ ] **Configuração de Email**
  - Template de emails do Supabase Auth
  - SMTP configurado (se customizado)
  - Testar envio de emails

- [ ] **Integrations**
  - [ ] Facebook Ads - Access Token válido
  - [ ] Webhooks - URLs corretas no Hotmart/ManyChat
  - [ ] Testar recebimento de webhooks

## 📊 Dados e Banco

- [ ] **Backup Inicial**
  - Exportar schema do banco
  - Documentar estrutura de dados
  - Plano de backup automático

- [ ] **Dados de Teste**
  - Limpar dados de desenvolvimento
  - Popular com dados seed (se aplicável)
  - Validar integridade dos dados

- [ ] **Índices e Performance**
  - Revisar índices em tabelas principais
  - Testar queries mais usadas
  - Otimizar se necessário

## 🚀 Deploy e Infraestrutura

- [ ] **Domain e SSL**
  - Configurar domínio customizado
  - Verificar certificado SSL ativo
  - Testar redirecionamentos

- [ ] **Edge Functions**
  - Confirmar deploy de todas as functions
  - Testar execução em produção
  - Verificar logs de erro

- [ ] **Monitoramento**
  - Configurar alertas de erro
  - Acompanhar métricas de performance
  - Definir thresholds

## 🧪 Testes Finais

- [ ] **Fluxos Críticos**
  - [ ] Cadastro de novo usuário
  - [ ] Login e logout
  - [ ] Criação de lead
  - [ ] Captura via webhook
  - [ ] Dashboard carregando dados reais
  - [ ] Sincronização Facebook Ads

- [ ] **Responsividade**
  - [ ] Mobile (320px+)
  - [ ] Tablet (768px+)
  - [ ] Desktop (1024px+)

- [ ] **Cross-browser**
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari

## 📝 Documentação

- [ ] **Documentação de Usuário**
  - Guia de primeiros passos
  - FAQs básicas
  - Tutoriais em vídeo (opcional)

- [ ] **Documentação Técnica**
  - Arquitetura do sistema
  - Fluxo de dados
  - Guia de manutenção

- [ ] **Changelog**
  - Versão inicial documentada
  - Processo de versionamento definido

## 🎯 Go-Live

- [ ] **Comunicação**
  - Informar equipe sobre go-live
  - Preparar suporte para dúvidas
  - Plano de rollback se necessário

- [ ] **Validação Pós-Deploy**
  - Verificar aplicação no ar
  - Testar fluxos principais
  - Monitorar primeiras horas

- [ ] **Feedback Loop**
  - Canal de feedback dos usuários
  - Sistema de bug report
  - Roadmap de melhorias

---

## 🚨 Atenção Especial

### Não esquecer:
1. ⚠️ Desabilitar modo dev (`VITE_DEV_MODE=false`)
2. ⚠️ Desabilitar auto-confirm email
3. ⚠️ Criar primeiro admin
4. ⚠️ Executar security scan
5. ⚠️ Testar todas as permissões

### Em caso de problemas:
- Logs disponíveis no Lovable Cloud
- Edge function logs em tempo real
- Auth logs no dashboard Supabase

---

**Data de Go-Live Planejada:** _____________

**Responsável pelo Deploy:** _____________

**Versão:** 1.0.0