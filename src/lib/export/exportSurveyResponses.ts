import * as XLSX from "xlsx";

interface SurveyResponseExportData {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  answers: Record<string, any>;
  score: number;
  level: string;
  percentile: number;
  createdAt: string;
}

export const exportSurveyResponsesToCSV = (
  responses: SurveyResponseExportData[],
  surveyName: string,
  questions: string[]
) => {
  if (responses.length === 0) return;

  // Build headers
  const headers = [
    "Lead",
    "Email",
    "Telefone",
    ...questions,
    "Score MQL",
    "Nível",
    "Percentil",
    "Data",
  ];

  // Build rows
  const rows = responses.map((r) => [
    r.leadName || "-",
    r.leadEmail || "-",
    r.leadPhone || "-",
    ...questions.map((q) => r.answers[q] || "-"),
    r.score,
    r.level,
    `Top ${Math.round(100 - r.percentile)}%`,
    r.createdAt,
  ]);

  // Sanitize a CSV cell value to prevent formula injection
  const sanitizeCell = (value: unknown): string => {
    let str = String(value ?? "");
    // Prevent CSV formula injection
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    // Escape double quotes
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  // Create CSV content
  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => sanitizeCell(cell)).join(";")),
  ].join("\n");

  // Download
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `respostas-${surveyName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export const exportSurveyResponsesToExcel = (
  responses: SurveyResponseExportData[],
  surveyName: string,
  questions: string[]
) => {
  if (responses.length === 0) return;

  // Build headers
  const headers = [
    "Lead",
    "Email",
    "Telefone",
    ...questions,
    "Score MQL",
    "Nível",
    "Percentil",
    "Data",
  ];

  // Build rows
  const rows = responses.map((r) => [
    r.leadName || "-",
    r.leadEmail || "-",
    r.leadPhone || "-",
    ...questions.map((q) => r.answers[q] || "-"),
    r.score,
    r.level,
    `Top ${Math.round(100 - r.percentile)}%`,
    r.createdAt,
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Respostas");

  // Download
  XLSX.writeFile(
    wb,
    `respostas-${surveyName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.xlsx`
  );
};
