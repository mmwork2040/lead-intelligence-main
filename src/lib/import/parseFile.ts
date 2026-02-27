// Parser robusto para arquivos CSV e Excel
import * as XLSX from 'xlsx';

export type ParsedFile = {
  headers: string[];
  data: Record<string, any>[];
  totalRows: number;
};

// Detecta o delimitador do CSV (vírgula ou ponto-e-vírgula)
const detectDelimiter = (content: string): string => {
  const firstLine = content.split("\n")[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
};

// Parser CSV robusto que trata aspas e delimitadores
export const parseCSV = (content: string): ParsedFile => {
  // Remove BOM se existir
  content = content.replace(/^\uFEFF/, '');
  
  // Normaliza quebras de linha
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const lines = content.split("\n").filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error("Arquivo vazio");
  }

  const delimiter = detectDelimiter(content);
  
  // Parser que respeita aspas e escapa delimitadores dentro de campos
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Aspas duplas escapadas
          current += '"';
          i++;
        } else {
          // Toggle estado de aspas
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Delimitador fora de aspas - fim do campo
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Adiciona último campo
    result.push(current.trim());
    
    return result;
  };

  // Parse headers
  const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
  
  if (headers.length === 0) {
    throw new Error("Nenhuma coluna encontrada no arquivo");
  }

  // Parse data
  const data: Record<string, any>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]).map(v => v.replace(/^["']|["']$/g, ''));
    
    // Ignora linhas vazias ou com número errado de colunas
    if (values.length === 1 && values[0] === '') continue;
    if (values.length !== headers.length) {
      console.warn(`Linha ${i + 1} ignorada: número de colunas não corresponde (esperado: ${headers.length}, encontrado: ${values.length})`);
      continue;
    }
    
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    
    data.push(row);
  }

  if (data.length === 0) {
    throw new Error("Nenhum dado válido encontrado no arquivo");
  }

  return {
    headers,
    data,
    totalRows: data.length,
  };
};

// Parser Excel usando biblioteca xlsx
export const parseExcel = async (file: File): Promise<ParsedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pega a primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error("Nenhuma planilha encontrada no arquivo"));
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON mantendo headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false 
        }) as any[][];
        
        if (jsonData.length === 0) {
          reject(new Error("Planilha vazia"));
          return;
        }
        
        // Primeira linha são os headers
        const headers = jsonData[0].map((h: any) => String(h).trim());
        
        if (headers.length === 0) {
          reject(new Error("Nenhuma coluna encontrada na planilha"));
          return;
        }
        
        // Restante são os dados
        const dataRows: Record<string, any>[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i];
          
          if (!values || values.length === 0) continue;
          
          const row: Record<string, any> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] !== undefined ? String(values[index]).trim() : '';
          });
          
          dataRows.push(row);
        }
        
        if (dataRows.length === 0) {
          reject(new Error("Nenhum dado válido encontrado na planilha"));
          return;
        }
        
        resolve({
          headers,
          data: dataRows,
          totalRows: dataRows.length,
        });
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Erro ao ler arquivo"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const parseFile = async (file: File): Promise<ParsedFile> => {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const content = await file.text();
    return parseCSV(content);
  }

  if (extension === "xls" || extension === "xlsx") {
    return parseExcel(file);
  }

  throw new Error("Formato não suportado. Use CSV ou Excel (.xlsx)");
};

export const validateParsedData = (parsed: ParsedFile): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (parsed.headers.length === 0) {
    errors.push("Nenhuma coluna encontrada no arquivo");
  }

  if (parsed.data.length === 0) {
    errors.push("Nenhum dado encontrado no arquivo");
  }

  if (parsed.data.length > 10000) {
    errors.push("Limite de 10.000 linhas excedido");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
