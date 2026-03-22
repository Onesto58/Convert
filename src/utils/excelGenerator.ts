import { utils, write } from 'xlsx';
import type { ColumnRule } from '../types';
import { applyTransformation } from './transformations';

export const generateExcel = (
  data: any[],
  rules: ColumnRule[],
  startRow: number
): Blob | null => {
  if (!data || data.length === 0) return null;

  // Filter and sort active rules
  const activeRules = rules
    .filter(r => r.is_visible)
    .sort((a, b) => a.position_index - b.position_index);

  // Transform data mapping old headers to new headers
  const transformedData = data.map(row => {
    const newRow: Record<string, any> = {};
    activeRules.forEach(rule => {
      newRow[rule.new_header] = applyTransformation(row, rule);
    });
    return newRow;
  });

  // Create empty worksheet
  const ws = utils.aoa_to_sheet([]);
  
  // Insert exactly at the requested row (1-indexed in Excel usually -> origin A1, A2, etc)
  const originCell = `A${Math.max(1, startRow)}`;
  utils.sheet_add_json(ws, transformedData, { origin: originCell, skipHeader: false });

  // Generate workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Dati Convertiti");

  // Output to Blob
  const wbout = write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};
