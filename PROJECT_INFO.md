# Leads Intelligence Platform - Informações do Projeto

## 📋 Sobre o Sistema

Este é um sistema genérico de gestão de leads e campanhas, projetado para ser facilmente personalizado e adaptado às necessidades específicas de cada empresa.

## 🎨 Personalização do Branding

### Nome do Sistema
O nome atual é "Leads Intelligence Platform". Para personalizá-lo:

1. **Título da página (index.html):**
   - Linha 6: `<title>Seu Nome Aqui</title>`
   - Linha 8: meta description
   - Linha 10: meta og:title

2. **Logo e nome visual:**
   - `src/components/DashboardLayout.tsx` (linhas 44, 55)
   - `src/components/MobileNav.tsx` (linha 48)
   - `src/components/LandingHero.tsx` (linha 24)
   - `src/pages/Auth.tsx` (linha 72)

### Logo
Atualmente usando um gradiente como placeholder:
```tsx
<div className="w-8 h-8 rounded-lg gradient-primary" />
```

Para adicionar seu logo:
1. Adicione o arquivo de imagem em `public/` ou `src/assets/`
2. Substitua o `<div>` por `<img src="/seu-logo.png" alt="Logo" className="w-8 h-8" />`

### Cores e Design
As cores do sistema são configuradas em:
- `src/index.css` - Variáveis CSS de cores
- `tailwind.config.ts` - Configuração do Tailwind

Principais variáveis para customizar:
```css
--primary: HSL da cor primária
--secondary: HSL da cor secundária
--accent: HSL da cor de destaque
```

## 🔧 Configurações do Sistema

### Modo Desenvolvimento
O sistema está configurado em modo desenvolvimento por padrão:

- ✅ Acessos liberados sem autenticação
- ✅ Todas as permissões habilitadas
- ✅ Auto-confirm de emails ativo

Para controlar: variável `VITE_DEV_MODE` no arquivo `.env`

### Parâmetros de Rastreamento
O sistema usa parâmetros UTM e um parâmetro customizável:
- `?project=slug` - Identifica a campanha/projeto (antes era `?osv_project=slug`)
- UTMs padrão: `utm_source`, `utm_campaign`, `utm_medium`, `utm_content`, `utm_term`

### Webhook URLs
Atualize as referências nos webhooks se mudar o domínio:
- `src/pages/Integrations.tsx` contém os endpoints padrão

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `leads` - Leads capturados
- `lead_events` - Timeline de eventos
- `purchases` - Compras/conversões
- `campaigns` - Campanhas de marketing
- `webhook_logs` - Logs de integrações
- `user_roles` - Roles e permissões
- `system_config` - Configurações do sistema
- `fb_*` - Tabelas de integração Facebook Ads

### Permissões e Roles
Roles disponíveis (enum `app_role`):
- `admin` - Acesso total
- `commercial` - Acesso comercial (sem financeiro)
- `financial` - Acesso financeiro e relatórios
- `support` - Suporte e visualização

## 🚀 Deployment

### Frontend
O frontend é automaticamente deployado pelo Lovable:
- Preview URL: disponível automaticamente
- Produção: clique em "Publish" no canto superior direito

### Backend (Edge Functions)
As Edge Functions são deployadas automaticamente quando você salva:
- `sync-facebook-ads` - Sincronização com Facebook Ads
- `webhook-*` - Processamento de webhooks

## 🔐 Segurança

### Row Level Security (RLS)
Todas as tabelas possuem RLS habilitado. Em produção:
- Verifique as policies antes de ir ao ar
- Teste com usuários de diferentes roles
- Execute o security scan do Lovable

### Secrets
Configurados no Lovable Cloud:
- Nunca commite secrets no código
- Use a interface de settings para configurar tokens/keys

## 📝 Próximos Passos

Para colocar em produção:
1. Consulte o arquivo `PRODUCTION_CHECKLIST.md`
2. Personalize branding completo
3. Configure domínio customizado
4. Teste autenticação e permissões
5. Revise políticas de segurança

## 📚 Documentação Adicional

- [Lovable Docs](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 💡 Suporte

Para dúvidas sobre o sistema:
1. Revise a documentação do Lovable
2. Consulte as memórias do projeto (contexto de desenvolvimento)
3. Entre em contato com o time de desenvolvimento