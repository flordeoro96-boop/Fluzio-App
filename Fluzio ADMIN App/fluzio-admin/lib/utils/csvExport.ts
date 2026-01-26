/**
 * CSV Export Utility
 * Converts data arrays to CSV format and triggers download
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Determine columns
  let headers: string[];
  let keys: string[];

  if (columns && columns.length > 0) {
    headers = columns.map(col => col.label);
    keys = columns.map(col => String(col.key));
  } else {
    // Use all keys from first object
    keys = Object.keys(data[0]);
    headers = keys.map(key => 
      key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    );
  }

  // Build CSV content
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  data.forEach(row => {
    const values = keys.map(key => {
      const value = row[key];
      return escapeCSVValue(formatValue(value));
    });
    csvRows.push(values.join(','));
  });

  const csvContent = csvRows.join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Handle nested objects/arrays
    return JSON.stringify(value);
  }
  
  return String(value);
}
