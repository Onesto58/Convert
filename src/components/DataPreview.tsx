import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { ColumnRule } from '../types';
import { applyTransformation } from '../utils/transformations';

interface DataPreviewProps {
  data: any[];
  rules: ColumnRule[];
}

export const DataPreview: React.FC<DataPreviewProps> = React.memo(({ data, rules }) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'dbf'>('excel');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) return null;

  const excelRules = useMemo(() => 
    rules.filter(r => r.is_visible).sort((a, b) => a.position_index - b.position_index),
  [rules]);

  const dbfRules = useMemo(() => 
    rules.filter(r => !r.is_visible),
  [rules]);
  
  const previewData = useMemo(() => data.slice(0, 50), [data]);

  // Gestione rotella mouse: trasforma scroll verticale in orizzontale
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, []);

  return (
    <div className="border rounded-xl bg-card flex flex-col h-full shadow-xs overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="flex border-b bg-muted/10 p-2 gap-2 shrink-0">
        <button
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'excel' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          onClick={() => setActiveTab('excel')}
        >
          Excel
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeTab === 'dbf' ? 'bg-background border text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
          onClick={() => setActiveTab('dbf')}
        >
          Scartate
        </button>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="p-0 overflow-auto flex-1 custom-scrollbar"
      >
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-muted/30 sticky top-0 z-10 shadow-xs border-b">
            <tr>
              {activeTab === 'excel' 
                ? excelRules.map(rule => (
                    <th key={rule.original_header} className="px-3 py-2 font-black text-[10px] uppercase tracking-wider whitespace-nowrap bg-muted/90 backdrop-blur-sm">
                      {rule.new_header}
                    </th>
                  ))
                : dbfRules.map(rule => (
                    <th key={rule.original_header} className="px-3 py-2 font-black text-[10px] uppercase tracking-wider whitespace-nowrap bg-muted/90 backdrop-blur-sm">
                      {rule.original_header}
                    </th>
                  ))
              }
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {previewData.map((row, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                {activeTab === 'excel'
                  ? excelRules.map(rule => (
                      <td key={rule.original_header} className="px-3 py-1.5 whitespace-nowrap font-medium">
                        {applyTransformation(row, rule)}
                      </td>
                    ))
                  : dbfRules.map(rule => (
                      <td key={rule.original_header} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground/50 italic font-mono text-[10px]">
                        {row[rule.original_header]}
                      </td>
                    ))
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(data.length > 50) && (
        <div className="px-3 py-1.5 border-t text-[10px] text-center text-muted-foreground bg-muted/5 font-bold uppercase tracking-widest">
          Anteprima: 50 di {data.length} righe
        </div>
      )}
    </div>
  );
});

DataPreview.displayName = 'DataPreview';
