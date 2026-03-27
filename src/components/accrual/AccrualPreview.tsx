import { Table, User, Calculator as CalcIcon } from 'lucide-react';
import type { AccrualEmployee, AccrualRule } from '../../types';
import { calculateAccrualRow } from '../../utils/accrualParser';

interface AccrualPreviewProps {
  data: AccrualEmployee[];
  rules: AccrualRule[];
}

export const AccrualPreview: React.FC<AccrualPreviewProps> = ({ data, rules }) => {
  if (data.length === 0) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card border rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Table size={16} className="text-primary" />
          Anteprima Risultati ({data.length} persone)
        </h3>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-10 bg-card border-b shadow-xs">
            <tr>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground w-24">Matricola</th>
              <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-muted-foreground">Nominativo</th>
              {rules.map((rule, i) => (
                <th key={i} className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-primary text-right bg-primary/5">
                  {rule.column_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((employee) => (
              <tr key={employee.matricola} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">{employee.matricola}</td>
                <td className="px-4 py-2.5 font-bold text-[13px] flex items-center gap-2">
                    <div className="p-1 bg-muted rounded shadow-xs shrink-0">
                        <User size={12} className="text-muted-foreground" />
                    </div>
                    {employee.nome}
                </td>
                {rules.map((rule, i) => {
                  const value = calculateAccrualRow(employee, rule.selected_values);
                  return (
                    <td key={i} className="px-4 py-2.5 text-right font-black text-[13px]">
                      {typeof value === 'number' 
                        ? value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rules.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
            <CalcIcon size={48} className="mb-4" />
            <p className="text-sm font-medium">Nessuna colonna calcolata configurata</p>
        </div>
      )}
    </div>
  );
};
