import * as XLSX from 'xlsx';
import type { AccrualEmployee, AccrualRule } from '../types';
import { calculateAccrualRow } from './accrualParser';

export const generateAccrualExcel = (data: AccrualEmployee[], rules: AccrualRule[]): Blob => {
  const worksheetData: any[] = data.map((employee) => {
    const row: any = {
      'Matricola': employee.matricola,
      'Nominativo': employee.nome
    };

    rules.forEach((rule) => {
      row[rule.column_name] = calculateAccrualRow(employee, rule.selected_values);
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Accrual");

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
