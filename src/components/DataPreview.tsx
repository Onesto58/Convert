import React, { useState, useMemo } from 'react';
import type { ColumnRule } from '../types';

interface DataPreviewProps {
  data: any[];
  rules: ColumnRule[];
}

export const DataPreview: React.FC<DataPreviewProps> = React.memo(({ data, rules }) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'dbf'>('excel');

  if (!data || data.length === 0) return null;

  const excelRules = useMemo(() => 
    rules.filter(r => r.is_visible).sort((a, b) => a.position_index - b.position_index),
  [rules]);

  const dbfRules = useMemo(() => 
    rules.filter(r => !r.is_visible),
  [rules]);
  
  const previewData = useMemo(() => data.slice(0, 50), [data]); // Reduced to 50 for even better performance

  return (
    <div className="border rounded-2xl bg-card flex flex-col h-full shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex border-b bg-muted/20 p-4 gap-3 shrink-0">
        <button
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'excel' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted'}`}
          onClick={() => setActiveTab('excel')}
        >
          Anteprima Excel
        </button>
        <button
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dbf' ? 'bg-background border text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          onClick={() => setActiveTab('dbf')}
        >
          Colonne Scartate (DBF)
        </button>
      </div>
      
      <div className="p-0 overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm border-b">
            <tr>
              {activeTab === 'excel' 
                ? excelRules.map(rule => (
                    <th key={rule.original_header} className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap bg-muted/90 backdrop-blur-md">
                      {rule.new_header}
                    </th>
                  ))
                : dbfRules.map(rule => (
                    <th key={rule.original_header} className="px-6 py-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap bg-muted/90 backdrop-blur-md">
                      {rule.original_header}
                    </th>
                  ))
              }
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {previewData.map((row, i) => (
              <tr key={i} className="hover:bg-muted/40 transition-colors group">
                {activeTab === 'excel'
                  ? excelRules.map(rule => (
                      <td key={rule.original_header} className="px-6 py-4 whitespace-nowrap font-medium">
                        {row[rule.original_header]}
                      </td>
                    ))
                  : dbfRules.map(rule => (
                      <td key={rule.original_header} className="px-6 py-4 whitespace-nowrap text-muted-foreground/60 italic font-mono text-xs">
                        {row[rule.original_header]}
                      </td>
                    ))
                }
              </tr>
            ))}
            {previewData.length === 0 && (
              <tr>
                <td colSpan={100} className="px-10 py-20 text-center text-muted-foreground italic">
                  Nessun dato da visualizzare qui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(data.length > 50) && (
        <div className="px-6 py-3 border-t text-xs text-center text-muted-foreground bg-muted/10 font-medium">
          Visualizzando un estratto di 50 righe su {data.length} totali.
        </div>
      )}
    </div>
  );
});

DataPreview.displayName = 'DataPreview';
