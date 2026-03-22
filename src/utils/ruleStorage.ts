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
  // clean up IDs if they don't exist yet to let Supabase generate them,
  // or pass them to update. Upsert config handles it if we match on original_header
  const rulesToSave = rules.map(({ id, ...rest }) => rest);
  
  const { error } = await supabase
    .from('column_rules')
    .upsert(rulesToSave, { onConflict: 'original_header' });
    
  if (error) {
    console.error('Error saving rules to Supabase:', error);
    throw error;
  }
};
