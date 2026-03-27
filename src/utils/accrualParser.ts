import * as XLSX from 'xlsx';
import type { AccrualEmployee, AccrualValues, AccrualSttfr } from '../types';

export const parseExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        resolve(XLSX.utils.sheet_to_json(worksheet));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
};

export const parseRateiData = (jsonData: any[]): Map<string, AccrualEmployee> => {
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
  return employeesMap;
};

export const parseSttfrData = (jsonData: any[]): Map<string, AccrualSttfr> => {
  const sttfrMap = new Map<string, AccrualSttfr>();
  jsonData.forEach((row) => {
    const matricola = String(row['Matricola'] || '').trim();
    if (!matricola) return;
    
    sttfrMap.set(matricola, {
      dt_lic: row['Dt_lic.'],
      tfr_da_riportare: Number(row['TFR_da_riportare'] || 0),
      quota_tfr_fondi_prev: Number(row['Quota_TFR_Fondi_Prev.'] || 0)
    });
  });
  return sttfrMap;
};

export const calculateAccrualRow = (employee: AccrualEmployee, selectedValues: string[]): number | string => {
  let sum = 0;
  let isDate = false;

  selectedValues.forEach((path) => {
    const [section, field] = path.toLowerCase().split('.');
    
    if (section === 'sttfr') {
      if (employee.sttfr) {
        const val = (employee.sttfr as any)[field];
        if (field === 'dt_lic') {
            isDate = true;
            return; // Dates can't be summed, but let's assume if it's selected alone it shows up
        }
        sum += Number(val || 0);
      }
    } else {
      if (employee.matrix[section] && field in employee.matrix[section]) {
        sum += (employee.matrix[section] as any)[field] || 0;
      }
    }
  });

  if (isDate && selectedValues.length === 1) {
    return employee.sttfr?.dt_lic || "";
  }

  return sum;
};
