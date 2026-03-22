import type { ColumnRule } from '../types';

export const applyTransformation = (row: any, rule: ColumnRule): any => {
  // Conversione sicura a numero
  const toNumber = (val: any) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Rimuove spazi e trasforma la virgola in punto per il parsing decimale
    const cleaned = val.toString().trim().replace(',', '.');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  let baseValue = toNumber(row[rule.original_header]);
  let totalValue = baseValue;

  // Somma con altre colonne se specificato
  if (rule.sum_with && Array.isArray(rule.sum_with)) {
    rule.sum_with.forEach(header => {
      const otherVal = row[header];
      totalValue += toNumber(otherVal);
    });
  }

  // Applica trasformazioni di segno
  if (rule.numeric_transformation && rule.numeric_transformation !== 'none') {
    switch (rule.numeric_transformation) {
      case 'always_positive':
        totalValue = Math.abs(totalValue);
        break;
      case 'always_negative':
        totalValue = -Math.abs(totalValue);
        break;
      case 'invert':
        totalValue = -totalValue;
        break;
    }
  }

  // Se non c'è stata alcuna trasformazione (somma o segno) e il valore originale non è un numero,
  // restituisci il valore originale invece di forzarlo a 0.
  // Ma se c'è una somma, restituisci il totale numerico.
  const hasSum = rule.sum_with && Array.isArray(rule.sum_with) && rule.sum_with.length > 0;
  const hasSignTransform = rule.numeric_transformation && rule.numeric_transformation !== 'none';
  
  if (!hasSum && !hasSignTransform) {
    return row[rule.original_header];
  }

  return totalValue;
};
