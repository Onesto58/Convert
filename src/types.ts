export interface ColumnRule {
  id?: number;
  original_header: string;
  new_header: string;
  is_visible: boolean;
  position_index: number;
  numeric_transformation: 'none' | 'always_positive' | 'always_negative' | 'invert';
  sum_with?: string[]; // Array of original_headers to sum into this column
}
