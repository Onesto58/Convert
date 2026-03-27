import * as XLSX from 'xlsx';
import type { AccrualEmployee, AccrualValues } from '../types';

export const parseAccrualExcel = async (file: File): Promise<AccrualEmployee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!jsonData || jsonData.length === 0) {
          throw new Error("Il file Excel sembra essere vuoto.");
        }

        const employeesMap = new Map<string, AccrualEmployee>();

        jsonData.forEach((row) => {
          const matricola = String(row['Matricola'] || '').trim();
          const nome = String(row['Cognome_e_nome'] || '').trim();
          const tipo = String(row['Tipo'] || '').trim().toLowerCase();
          
          if (!matricola) return;

          if (!employeesMap.has(matricola)) {
            employeesMap.set(matricola, {
              matricola,
              nome,
              matrix: {}
            });
          }

          const employee = employeesMap.get(matricola)!;
          
          const values: AccrualValues = {
            importo: Number(row['Importo'] || 0),
            contributi: Number(row['Contributi'] || 0),
            inail: Number(row['INAIL'] || 0)
          };

          employee.matrix[tipo] = values;
        });

        resolve(Array.from(employeesMap.values()));
      } catch (err) {
        console.error("Errore nel parsing dell'Excel Accrual:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const calculateAccrualRow = (employee: AccrualEmployee, selectedValues: string[]): number => {
  let sum = 0;
  selectedValues.forEach((path) => {
    const [tipo, field] = path.toLowerCase().split('.');
    if (employee.matrix[tipo] && field in employee.matrix[tipo]) {
      sum += (employee.matrix[tipo] as any)[field] || 0;
    }
  });
  return sum;
};
