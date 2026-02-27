// Tradução de tipos de eventos
export const eventTypeLabels: Record<string, string> = {
  lead_created: "Cadastro realizado",
  new_lead: "Novo lead",
  lead_updated: "Dados atualizados",
  purchase_created: "Compra realizada",
  purchase_completed: "Compra concluída",
  purchase: "Compra",
  sale: "Venda",
  status_changed: "Status alterado",
  email_opened: "E-mail aberto",
  link_clicked: "Link clicado",
  cart_added: "Adicionado ao carrinho",
  cart_abandoned: "Carrinho abandonado",
  contact: "Contato realizado",
  contacted: "Contatado",
  lead_merged: "Leads unificados",
  lead_imported: "Lead importado",
  purchase_updated: "Compra atualizada",
  purchase_deleted: "Compra removida",
  // Eventos em maiúsculas do webhook Hotmart
  PURCHASE_COMPLETE: "Compra concluída",
  PURCHASE_APPROVED: "Compra aprovada",
  PURCHASE_CANCELED: "Compra cancelada",
  PURCHASE_REFUNDED: "Compra reembolsada",
  PURCHASE_DELAYED: "Pagamento atrasado",
  PURCHASE_CHARGEBACK: "Chargeback",
  PURCHASE_BILLET_PRINTED: "Boleto impresso",
  PURCHASE_PROTEST: "Compra protestada",
  SUBSCRIPTION_CANCELLATION: "Assinatura cancelada",
  // Atividades do sistema
  recent_lead: "Novo lead",
  recent_purchase: "Nova compra",
  new_client: "Novo cliente",
  new_purchase: "Nova compra",
};

// Tradução de status de compra
export const purchaseStatusLabels: Record<string, string> = {
  approved: "Aprovada",
  pending: "Pendente",
  declined: "Recusada",
  refunded: "Reembolsada",
  cancelled: "Cancelada",
  chargeback: "Estorno",
};

// Tradução de métodos de pagamento
export const paymentMethodLabels: Record<string, string> = {
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  pix: "PIX",
  boleto: "Boleto",
  paypal: "PayPal",
  bank_transfer: "Transferência Bancária",
  other: "Outro",
};

// Tradução de origens
export const sourceLabels: Record<string, string> = {
  manual: "Manual",
  import: "Importação",
  hotmart: "Hotmart",
  manychat: "ManyChat",
  n8n: "N8N",
  tracking_pixel: "Pixel de Rastreamento",
  facebook_ads: "Facebook Ads",
  instagram: "Instagram",
  organic: "Orgânico",
  whatsapp: "WhatsApp",
  email: "E-mail",
  outro: "Outro",
  other: "Outro",
  crm: "CRM",
};

// Funções auxiliares para traduzir com fallback
export const getEventLabel = (eventType: string): string => {
  return eventTypeLabels[eventType] || eventType.replace(/_/g, " ");
};

export const getPurchaseStatusLabel = (status: string): string => {
  return purchaseStatusLabels[status] || status;
};

export const getPaymentMethodLabel = (method: string | null): string => {
  if (!method) return "-";
  return paymentMethodLabels[method] || method;
};

export const getSourceLabel = (source: string | null): string => {
  if (!source) return "Não definida";
  return sourceLabels[source] || source;
};

// Tradução de plataformas de vendas
export const platformLabels: Record<string, string> = {
  hotmart: "Hotmart",
  eduzz: "Eduzz",
  kiwify: "Kiwify",
  monetizze: "Monetizze",
  stripe: "Stripe",
  pagarme: "Pagar.me",
  manual: "Manual",
  outro: "Outro",
};

// Tradução de regiões do Brasil
export const regionLabels: Record<string, string> = {
  norte: "Norte",
  nordeste: "Nordeste",
  centro_oeste: "Centro-Oeste",
  sudeste: "Sudeste",
  sul: "Sul",
};

// Estados brasileiros
export const brazilianStates: { value: string; label: string }[] = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

// Status CRM dos leads
export const crmStatusLabels: Record<string, string> = {
  novo: "Novo",
  lead: "Lead",
  engajado: "Engajado",
  comprador: "Comprador",
  inativo: "Inativo",
};

export const crmStatusOptions: { value: string; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "lead", label: "Lead" },
  { value: "engajado", label: "Engajado" },
  { value: "comprador", label: "Comprador" },
  { value: "inativo", label: "Inativo" },
];

// Tradução de gêneros
export const genderLabels: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
  nao_informado: "Não informado",
};

export const getPlatformLabel = (platform: string | null): string => {
  if (!platform) return "Não definida";
  return platformLabels[platform] || platform;
};

export const getRegionLabel = (region: string | null): string => {
  if (!region) return "-";
  return regionLabels[region] || region;
};

export const getGenderLabel = (gender: string | null): string => {
  if (!gender) return "Não informado";
  return genderLabels[gender] || gender;
};

export const getCrmStatusLabel = (status: string | null): string => {
  if (!status) return "Novo";
  return crmStatusLabels[status] || status;
};

// Helper para verificar status da campanha
export const getCampaignStatus = (campaign: { start_date: string | null; end_date: string | null }): 'active' | 'future' | 'ended' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!campaign.start_date || !campaign.end_date) return 'active';
  
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  
  if (startDate > today) return 'future';
  if (endDate < today) return 'ended';
  return 'active';
};

export const getCampaignStatusBadge = (status: 'active' | 'future' | 'ended'): string => {
  switch (status) {
    case 'active': return '🟢';
    case 'future': return '🟡';
    case 'ended': return '🔴';
  }
};

export const getCampaignStatusLabel = (status: 'active' | 'future' | 'ended'): string => {
  switch (status) {
    case 'active': return 'Ativa';
    case 'future': return 'Futura';
    case 'ended': return 'Finalizada';
  }
};
