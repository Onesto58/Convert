import { supabase } from './supabaseClient';
import type { ColumnRule } from '../types';

export const loadRules = async (): Promise<ColumnRule[]> => {
  const { data, error } = await supabase
    .from('column_rules')
    .select('*')
    .order('position_index', { ascending: true });
    
  if (error) {
    console.error('Error loading rules from Supabase:', error);
    return [];
  }
  return data as ColumnRule[];
};

export const saveRules = async (rules: ColumnRule[]): Promise<void> => {
  if (!rules || rules.length === 0) return;

  // Pulizia dei dati prima dell'upsert:
  // Rimuoviamo id e campi di timestamp forniti dalla query precedente.
  // Escludendo created_at e updated_at, diciamo a Supabase di usare i valori di default per i nuovi record
  // e di lasciare invariati (o far scattare i trigger per updated_at) i record esistenti.
  const rulesToSave = rules.map(({ id, created_at, updated_at, ...rest }: any) => rest);
  
  const { error } = await supabase
    .from('column_rules')
    .upsert(rulesToSave, { onConflict: 'original_header' });
    
  if (error) {
    console.error('Error saving rules to Supabase:', error);
    throw error;
  }
};
