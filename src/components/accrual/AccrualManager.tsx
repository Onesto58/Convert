import React, { useState, useEffect } from 'react';
import { FileUpload } from '../FileUpload';
import { AccrualConfigurator } from './AccrualConfigurator';
import { AccrualPreview } from './AccrualPreview';
import { parseExcelFile, parseRateiData, parseSttfrData } from '../../utils/accrualParser';
import { loadAccrualRules, saveAccrualRules } from '../../utils/accrualStorage';
import { generateAccrualExcel } from '../../utils/accrualExcelGenerator';
import type { AccrualEmployee, AccrualRule } from '../../types';
import { Download, RefreshCw, AlertCircle, FileCheck, FileWarning } from 'lucide-react';

export const AccrualManager: React.FC = () => {
  const [rateiFile, setRateiFile] = useState<File | null>(null);
  const [sttfrFile, setSttfrFile] = useState<File | null>(null);
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

  const handleRateiUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const jsonData = await parseExcelFile(file);
      const employeesMap = parseRateiData(jsonData);
      
      // If STTFR is already loaded, merge it
      if (sttfrFile && data.length > 0) {
          data.forEach(emp => {
              if (emp.sttfr && employeesMap.has(emp.matricola)) {
                  employeesMap.get(emp.matricola)!.sttfr = emp.sttfr;
              }
          });
      }
      
      setData(Array.from(employeesMap.values()));
      setRateiFile(file);
    } catch (err: any) {
      setError("Errore nel caricamento del file RATEI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSttfrUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const jsonData = await parseExcelFile(file);
      const sttfrMap = parseSttfrData(jsonData);
      
      if (data.length === 0) {
          setError("Carica prima il file RATEI per poter associare i dati STTFR.");
          return;
      }

      const newData = data.map(emp => ({
          ...emp,
          sttfr: sttfrMap.get(emp.matricola) || emp.sttfr
      }));
      
      setData(newData);
      setSttfrFile(file);
    } catch (err: any) {
      setError("Errore nel caricamento del file STTFR.");
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
      a.download = `Accrual_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    setRateiFile(null);
    setSttfrFile(null);
    setData([]);
    setError(null);
  };

  return (
    <div className="flex-1 flex flex-col py-4 min-h-0">
      {(!rateiFile || !sttfrFile) && !isLoading && (
        <div className="max-w-4xl mx-auto w-full mt-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tight mb-2 text-primary">Caricamento Dati Accrual</h2>
            <p className="text-sm text-muted-foreground">Carica entrambi i file per completare l'elaborazione.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RATEI Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold flex items-center gap-2">
                  {rateiFile ? <FileCheck className="text-green-500" size={18} /> : <FileWarning className="text-amber-500" size={18} />}
                  File RATEI
                </span>
                {rateiFile && <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Caricato</span>}
              </div>
              <FileUpload 
                onFileSelect={handleRateiUpload} 
                accept=".xlsx,.xls"
                title="RATEI"
                description="Matrice 5 righe per persona"
                id="ratei-upload"
              />
            </div>

            {/* STTFR Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-bold flex items-center gap-2">
                  {sttfrFile ? <FileCheck className="text-green-500" size={18} /> : <FileWarning className="text-amber-500" size={18} />}
                  File STTFR
                </span>
                {sttfrFile && <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">Caricato</span>}
              </div>
              <FileUpload 
                onFileSelect={handleSttfrUpload} 
                accept=".xlsx,.xls"
                title="STTFR"
                description="Dati TFR (una riga per persona)"
                id="sttfr-upload"
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <p className="font-semibold text-xs">{error}</p>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in">
          <RefreshCw size={32} className="animate-spin mb-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Elaborazione dati in corso...</p>
        </div>
      )}

      {rateiFile && sttfrFile && !isLoading && (
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
