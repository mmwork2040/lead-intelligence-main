/**
 * Export data to CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Sanitize a CSV cell value to prevent formula injection
  const sanitizeCSVValue = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    let stringValue = String(value);
    // Prevent CSV formula injection: prefix dangerous characters
    if (/^[=+\-@\t\r]/.test(stringValue)) {
      stringValue = "'" + stringValue;
    }
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Convert data to CSV format
  const csvContent = [
    // Header row
    headers.join(","),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => sanitizeCSVValue(row[header]))
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Delay revokeObjectURL to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
