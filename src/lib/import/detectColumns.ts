// Detecção inteligente de colunas baseada em nomes comuns

type ColumnMapping = {
  [key: string]: string | null;
};

const columnPatterns: Record<string, string[]> = {
  name: ["nome", "name", "nome completo", "full_name", "fullname", "nome_completo"],
  email: ["email", "e-mail", "e_mail", "mail", "correio"],
  phone: ["telefone", "phone", "whatsapp", "celular", "mobile", "tel", "fone"],
  ddd: ["ddd", "codigo_area", "area_code", "cod_area", "código de área"],
  cpf: ["cpf", "documento", "document", "tax_id"],
  
  // Endereço
  zip_code: ["cep", "zip", "zip_code", "codigo_postal", "postal_code", "código postal"],
  street: ["rua", "logradouro", "endereco", "street", "address", "endereço"],
  street_number: ["numero", "number", "num", "nro", "número"],
  complement: ["complemento", "complement", "apto", "apartamento", "bloco"],
  neighborhood: ["bairro", "neighborhood", "district"],
  city: ["cidade", "city", "municipio", "município"],
  state: ["estado", "state", "uf"],
  country: ["pais", "country", "país"],
  region: ["regiao", "region", "região"],
  
  // Demográficos
  gender: ["genero", "sexo", "gender", "gênero"],
  birth_date: ["nascimento", "data_nascimento", "birth_date", "birthday", "aniversario", "data de nascimento"],
  
  // CRM
  created_at: ["data", "created_at", "data_cadastro", "registered_at", "data_criacao", "date", "created"],
  source: ["origem", "source", "plataforma", "platform", "canal", "channel"],
  project_slug: ["project_slug", "projeto", "project", "campanha_interna"],
  
  // UTMs
  utm_source: ["utm_source", "utmsource", "utm source"],
  utm_campaign: ["utm_campaign", "utmcampaign", "utm campaign", "campanha"],
  utm_medium: ["utm_medium", "utmmedium", "utm medium", "meio"],
  utm_content: ["utm_content", "utmcontent", "utm content", "conteudo", "conteúdo"],
  utm_term: ["utm_term", "utmterm", "utm term", "termo"],
  
  // Tags
  tags: ["tags", "tag", "labels", "etiquetas", "categoria", "categorias", "label"],
  
  // Compra
  purchase_product: ["produto", "product", "produto_comprado", "item", "produto comprado"],
  purchase_value: ["valor", "value", "preco", "price", "total", "preço"],
  purchase_payment_method: ["pagamento", "payment", "forma_pagamento", "payment_method", "meio_pagamento"],
  purchase_status: ["status_pagamento", "payment_status", "situacao", "situação"],
  purchase_date: ["data_compra", "purchase_date", "data_venda", "data compra"],
};

export const detectColumnMapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Para cada header da planilha
  normalizedHeaders.forEach((header, index) => {
    const originalHeader = headers[index];
    
    // Tenta encontrar uma correspondência nos padrões
    for (const [field, patterns] of Object.entries(columnPatterns)) {
      if (patterns.some(pattern => header.includes(pattern))) {
        mapping[originalHeader] = field;
        break;
      }
    }

    // Se não encontrou correspondência, deixa null para mapeamento manual
    if (!mapping[originalHeader]) {
      mapping[originalHeader] = null;
    }
  });

  return mapping;
};

export const detectTagColumns = (headers: string[], sampleData: any[]): string[] => {
  const tagColumns: string[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  normalizedHeaders.forEach((header, index) => {
    const originalHeader = headers[index];
    
    // Colunas que explicitamente são tags
    if (columnPatterns.tags.some(pattern => header.includes(pattern))) {
      tagColumns.push(originalHeader);
      return;
    }

    // Detecta colunas que parecem categorias (valores repetidos, poucos únicos)
    const columnValues = sampleData.map(row => row[originalHeader]).filter(v => v);
    const uniqueValues = new Set(columnValues);
    
    // Se tem poucos valores únicos (< 20% do total), pode ser uma categoria/tag
    if (uniqueValues.size > 0 && uniqueValues.size < columnValues.length * 0.2) {
      tagColumns.push(originalHeader);
    }

    // Detecta colunas booleanas que podem ser tags
    const booleanValues = columnValues.filter(v => 
      typeof v === "boolean" || 
      v === "true" || 
      v === "false" ||
      v === "sim" ||
      v === "não" ||
      v === "yes" ||
      v === "no"
    );
    
    if (booleanValues.length > columnValues.length * 0.8) {
      tagColumns.push(originalHeader);
    }
  });

  return tagColumns;
};

export const extractTagsFromRow = (row: any, tagColumns: string[]): string[] => {
  const tags: string[] = [];

  tagColumns.forEach(column => {
    const value = row[column];
    
    if (!value) return;

    // Se é string com múltiplos valores separados
    if (typeof value === "string") {
      const separators = [",", ";", "|", "/"];
      let splitValues = [value];
      
      separators.forEach(sep => {
        if (value.includes(sep)) {
          splitValues = value.split(sep).map(v => v.trim()).filter(v => v);
        }
      });
      
      tags.push(...splitValues);
    }
    
    // Se é booleano true, usa o nome da coluna como tag
    else if (value === true || value === "true" || value === "sim" || value === "yes") {
      tags.push(column);
    }
    
    // Qualquer outro valor, converte para string
    else {
      tags.push(String(value).trim());
    }
  });

  // Remove duplicatas e normaliza
  return [...new Set(tags.map(t => t.toLowerCase().trim()))];
};

export const isDateColumn = (columnName: string): boolean => {
  const normalized = columnName.toLowerCase().trim();
  return columnPatterns.created_at.some(pattern => normalized.includes(pattern));
};

export const parseDate = (value: any): Date | null => {
  if (!value) return null;
  
  // Se já é uma data
  if (value instanceof Date) return value;
  
  // Tenta parsear string
  if (typeof value === "string") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Tenta parsear número (timestamp)
  if (typeof value === "number") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
};
