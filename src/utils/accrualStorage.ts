import { supabase } from './supabaseClient';
import type { AccrualRule } from '../types';

export const loadAccrualRules = async (): Promise<AccrualRule[]> => {
  const { data, error } = await supabase
    .from('accrual_rules')
    .select('*')
    .order('position_index', { ascending: true });
    
  if (error) {
    console.error('Error loading accrual rules from Supabase:', error);
    return [];
  }
  return data as AccrualRule[];
};

export const saveAccrualRules = async (rules: AccrualRule[]): Promise<void> => {
  if (!rules || rules.length === 0) return;

  const rulesToSave = rules.map(({ id, created_at, updated_at, ...rest }: any) => rest);
  
  const { error } = await supabase
    .from('accrual_rules')
    .upsert(rulesToSave, { onConflict: 'column_name' });
    
  if (error) {
    console.error('Error saving accrual rules to Supabase:', error);
    throw error;
  }
};

export const deleteAccrualRule = async (columnName: string): Promise<void> => {
    const { error } = await supabase
        .from('accrual_rules')
        .delete()
        .eq('column_name', columnName);
    
    if (error) {
        console.error('Error deleting accrual rule:', error);
        throw error;
    }
};
