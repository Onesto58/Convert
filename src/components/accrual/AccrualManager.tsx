import React, { useState, useEffect } from 'react';
import { FileUpload } from '../FileUpload';
import { AccrualConfigurator } from './AccrualConfigurator';
import { AccrualPreview } from './AccrualPreview';
import { parseAccrualExcel } from '../../utils/accrualParser';
import { loadAccrualRules, saveAccrualRules } from '../../utils/accrualStorage';
import { generateAccrualExcel } from '../../utils/accrualExcelGenerator';
import type { AccrualEmployee, AccrualRule } from '../../types';
import { Download, RefreshCw, AlertCircle, Calculator } from 'lucide-react';

export const AccrualManager: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<AccrualEmployee[]>([]);
  const [rules, setRules] = useState<AccrualRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const storedRules = await loadAccrualRules();
      setRules(storedRules);
    };
    init();
  }, []);

  // Auto-save rules with debounce
  useEffect(() => {
    if (rules.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        await saveAccrualRules(rules);
      } catch (err) {
        console.warn("Auto-save failed:", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [rules]);

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const parsedData = await parseAccrualExcel(selectedFile);
      setData(parsedData);
      setFile(selectedFile);
    } catch (err: any) {
      setError(err.message || "Errore nel caricamento del file.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await saveAccrualRules(rules);
      const blob = generateAccrualExcel(data, rules);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file ? `Accrual_${file.name.replace(/\.[^/.]+$/, "")}.xlsx` : "accrual_export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Errore durante l'esportazione.");
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col py-4 min-h-0">
      {!file && !isLoading && (
        <div className="max-w-xl mx-auto w-full mt-16 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center mb-12">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
              <Calculator size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Modulo Accrual</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Carica il file Excel delle competenze (5 righe per persona) per generare il prospetto sintetico.
            </p>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <p className="font-semibold text-xs">{error}</p>
            </div>
          )}
          <FileUpload 
            onFileSelect={handleFileSelect} 
            accept=".xlsx,.xls"
            title="Carica il file delle competenze"
            description="Trascina qui il file Excel o clicca per selezionarlo"
            id="accrual-upload"
          />
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in">
          <RefreshCw size={32} className="animate-spin mb-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Elaborazione dati in corso...</p>
        </div>
      )}

      {file && !isLoading && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 animate-in fade-in">
          <div className="lg:col-span-5 h-full flex flex-col bg-card rounded-xl border shadow-xs p-4 min-h-0">
            <AccrualConfigurator rules={rules} onRulesChange={setRules} />
            
            <div className="mt-4 pt-4 border-t flex gap-3 shrink-0">
              <button
                onClick={reset}
                className="px-4 py-2.5 bg-muted text-muted-foreground text-sm font-bold rounded-lg hover:bg-muted/80 transition-all flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Nuovo File
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || rules.length === 0}
                className="flex-1 py-2.5 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? 'Esportazione...' : 'Esporta Risultati'}
              </button>
            </div>
          </div>
          
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            <AccrualPreview data={data} rules={rules} />
          </div>
        </div>
      )}
    </div>
  );
};
