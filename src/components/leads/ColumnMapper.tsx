import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Tag } from "lucide-react";

interface ColumnMapperProps {
  headers: string[];
  mapping: Record<string, string | null>;
  onMappingChange: (mapping: Record<string, string | null>) => void;
  tagColumns: string[];
  onTagColumnsChange: (columns: string[]) => void;
  previewData: Record<string, any>[];
  useOriginalDate: boolean;
  onUseOriginalDateChange: (value: boolean) => void;
}

const fieldOptions = [
  { value: "", label: "Ignorar esta coluna", section: "" },
  
  // === DADOS BÁSICOS ===
  { value: "name", label: "Nome", section: "Dados Básicos" },
  { value: "email", label: "Email", section: "Dados Básicos" },
  { value: "phone", label: "Telefone", section: "Dados Básicos" },
  { value: "ddd", label: "DDD (será unificado ao telefone)", section: "Dados Básicos" },
  { value: "cpf", label: "CPF", section: "Dados Básicos" },
  
  // === ENDEREÇO ===
  { value: "zip_code", label: "CEP", section: "Endereço" },
  { value: "street", label: "Rua/Logradouro", section: "Endereço" },
  { value: "street_number", label: "Número", section: "Endereço" },
  { value: "complement", label: "Complemento", section: "Endereço" },
  { value: "neighborhood", label: "Bairro", section: "Endereço" },
  { value: "city", label: "Cidade", section: "Endereço" },
  { value: "state", label: "Estado (UF)", section: "Endereço" },
  { value: "country", label: "País", section: "Endereço" },
  { value: "region", label: "Região", section: "Endereço" },
  
  // === DADOS DEMOGRÁFICOS ===
  { value: "gender", label: "Gênero", section: "Demográficos" },
  { value: "birth_date", label: "Data de Nascimento", section: "Demográficos" },
  
  // === CRM ===
  { value: "crm_status", label: "Status CRM", section: "CRM" },
  { value: "source", label: "Origem", section: "CRM" },
  { value: "project_slug", label: "Projeto/Campanha", section: "CRM" },
  
  // === UTMs ===
  { value: "utm_source", label: "UTM Source", section: "Marketing" },
  { value: "utm_campaign", label: "UTM Campaign", section: "Marketing" },
  { value: "utm_medium", label: "UTM Medium", section: "Marketing" },
  { value: "utm_content", label: "UTM Content", section: "Marketing" },
  { value: "utm_term", label: "UTM Term", section: "Marketing" },
  
  // === DATAS ===
  { value: "created_at", label: "Data de Criação", section: "Datas" },
  
  // === TAGS ===
  { value: "tags", label: "Tags (múltiplos valores)", section: "Tags" },
  
  // === COMPRA ===
  { value: "purchase_product", label: "Produto Comprado", section: "Compra" },
  { value: "purchase_value", label: "Valor da Compra", section: "Compra" },
  { value: "purchase_payment_method", label: "Meio de Pagamento", section: "Compra" },
  { value: "purchase_status", label: "Status do Pagamento", section: "Compra" },
  { value: "purchase_date", label: "Data da Compra", section: "Compra" },
];

export const ColumnMapper = ({
  headers,
  mapping,
  onMappingChange,
  tagColumns,
  onTagColumnsChange,
  previewData,
  useOriginalDate,
  onUseOriginalDateChange,
}: ColumnMapperProps) => {
  const handleMappingChange = (header: string, value: string | null) => {
    onMappingChange({ ...mapping, [header]: value });
  };

  const handleToggleTagColumn = (header: string) => {
    if (tagColumns.includes(header)) {
      onTagColumnsChange(tagColumns.filter((c) => c !== header));
    } else {
      onTagColumnsChange([...tagColumns, header]);
    }
  };

  const hasDateColumn = Object.values(mapping).includes("created_at");

  return (
    <div className="space-y-6">
      {/* Mapeamento de colunas */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Mapeamento de colunas</h3>
        {headers.map((header) => (
          <div key={header} className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {header}
              </Badge>
              {tagColumns.includes(header) && (
                <Badge variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  Tag
                </Badge>
              )}
            </div>
            
            <div className="text-muted-foreground">→</div>
            
            <div className="flex items-center gap-2">
              <Select
                value={mapping[header] || "ignore"}
                onValueChange={(value) =>
                  handleMappingChange(header, value === "ignore" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {fieldOptions.map((option, idx) => {
                    // Renderizar separador de seção
                    const prevOption = idx > 0 ? fieldOptions[idx - 1] : null;
                    const showSectionHeader = option.section && option.section !== prevOption?.section;
                    
                    return (
                      <div key={option.value || "ignore"}>
                        {showSectionHeader && option.section && (
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {option.section}
                          </div>
                        )}
                        <SelectItem value={option.value || "ignore"}>
                          {option.label}
                        </SelectItem>
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {mapping[header] && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
              
              <Checkbox
                checked={tagColumns.includes(header)}
                onCheckedChange={() => handleToggleTagColumn(header)}
              />
              <Label className="text-xs text-muted-foreground cursor-pointer">
                Tag
              </Label>
            </div>
          </div>
        ))}
      </div>

      {/* Opções de data */}
      {hasDateColumn && (
        <div className="flex items-center space-x-2 p-4 rounded-lg border bg-card">
          <Checkbox
            checked={useOriginalDate}
            onCheckedChange={(checked) => onUseOriginalDateChange(checked as boolean)}
          />
          <Label className="cursor-pointer">
            Usar data de cadastro original do arquivo (recomendado)
          </Label>
        </div>
      )}

      {/* Preview dos dados */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Preview dos dados (primeiros 5)
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {headers.slice(0, 5).map((header) => (
                    <th key={header} className="px-4 py-2 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {headers.slice(0, 5).map((header) => (
                      <td key={header} className="px-4 py-2">
                        {String(row[header] || "").substring(0, 30)}
                        {String(row[header] || "").length > 30 ? "..." : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
