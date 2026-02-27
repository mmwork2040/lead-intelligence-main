// Mapeamento de estado para região
const stateToRegion: Record<string, string> = {
  AC: 'norte', AM: 'norte', AP: 'norte', PA: 'norte', RO: 'norte', RR: 'norte', TO: 'norte',
  AL: 'nordeste', BA: 'nordeste', CE: 'nordeste', MA: 'nordeste', PB: 'nordeste', 
  PE: 'nordeste', PI: 'nordeste', RN: 'nordeste', SE: 'nordeste',
  DF: 'centro_oeste', GO: 'centro_oeste', MS: 'centro_oeste', MT: 'centro_oeste',
  ES: 'sudeste', MG: 'sudeste', RJ: 'sudeste', SP: 'sudeste',
  PR: 'sul', RS: 'sul', SC: 'sul',
};

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  region: string;
}

export const fetchAddressByCEP = async (cep: string): Promise<AddressData | null> => {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP inválido');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    // Determinar região automaticamente baseado no estado
    const region = stateToRegion[data.uf] || '';

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      region: region,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export const getRegionByState = (state: string): string => {
  return stateToRegion[state.toUpperCase()] || '';
};
