export interface ColumnRule {
  id?: number;
  original_header: string;
  new_header: string;
  is_visible: boolean;
  position_index: number;
  numeric_transformation: 'none' | 'always_positive' | 'always_negative' | 'invert';
  sum_with?: string[]; // Array of original_headers to sum into this column
}

export interface AccrualRule {
  id?: number;
  column_name: string;
  selected_values: string[]; // e.g., ["ferie.importo", "13a.inail"]
  position_index: number;
}

export interface AccrualValues {
  importo: number;
  contributi: number;
  inail: number;
}

export interface AccrualSttfr {
  dt_lic?: string | number;
  tfr_da_riportare: number;
  quota_tfr_fondi_prev: number;
}

export interface AccrualEmployee {
  matricola: string;
  nome: string;
  matrix: {
    [key: string]: AccrualValues;
  };
  sttfr?: AccrualSttfr;
}
