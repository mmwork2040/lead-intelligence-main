import * as XLSX from "xlsx";

interface InvoiceExportData {
  created_at: string;
  lead_name: string | null;
  lead_cpf: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  value: number;
  description: string;
  notes: string | null;
  status: string;
  purchases?: {
    product_name: string;
    purchase_date: string;
    payment_method?: string;
    value?: number;
  } | null;
  leads?: {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    street?: string;
    street_number?: string;
    neighborhood?: string;
  } | null;
}

export const exportInvoicesToCSV = (data: InvoiceExportData[], filename: string = "pedidos-nf") => {
  const formattedData = data.map((item) => {
    const purchaseDate = item.purchases?.purchase_date || item.created_at;
    const issueMonth = (() => {
      const date = new Date(purchaseDate);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return nextMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    })();

    // Build full address
    const addressParts = [
      item.leads?.street,
      item.leads?.street_number,
      item.leads?.neighborhood,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "-";

    return {
      "Data Compra": new Date(purchaseDate).toLocaleDateString("pt-BR"),
      "Mês Emissão NF": issueMonth,
      "Produto": item.purchases?.product_name || item.description || "-",
      "Nome": item.lead_name || item.leads?.name || "-",
      "CPF": item.lead_cpf || item.leads?.cpf || "-",
      "Email": item.lead_email || item.leads?.email || "-",
      "Telefone": item.lead_phone || item.leads?.phone || "-",
      "Endereço": fullAddress,
      "Cidade": item.leads?.city || "-",
      "Estado": item.leads?.state || "-",
      "CEP": item.leads?.zip_code || "-",
      "Valor (R$)": Number(item.value).toFixed(2),
      "Forma Pagamento": item.purchases?.payment_method || "-",
      "Status NF": item.status === "pending" ? "Pendente" : item.status === "sent" ? "Enviado" : "Emitido",
      "Observações": item.notes || "-",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos NF");

  // Auto-size columns
  const maxWidth = formattedData.reduce((acc, row) => {
    Object.keys(row).forEach((key) => {
      const value = String(row[key as keyof typeof row] || "");
      acc[key] = Math.max(acc[key] || 10, value.length);
    });
    return acc;
  }, {} as Record<string, number>);

  worksheet["!cols"] = Object.keys(maxWidth).map((key) => ({ wch: maxWidth[key] + 2 }));

  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`);
};
