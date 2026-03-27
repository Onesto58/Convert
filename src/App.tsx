import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { RuleConfiguration } from './components/RuleConfiguration';
import { DataPreview } from './components/DataPreview';
import { LandingPage } from './components/LandingPage';
import { AccrualManager } from './components/accrual/AccrualManager';
import type { ColumnRule } from './types';
import { parseFile } from './utils/fileParser';
import { loadRules, saveRules } from './utils/ruleStorage';
import { generateExcel } from './utils/excelGenerator';
import { Download, RefreshCw, AlertCircle, FileSpreadsheet, LayoutGrid, Calculator } from 'lucide-react';

type AppPath = 'landing' | 'dbf-to-excel' | 'accrual';

function App() {
  const [currentPath, setCurrentPath] = useState<AppPath>('landing');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [rules, setRules] = useState<ColumnRule[]>([]);
  const [startRow, setStartRow] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save rules with debounce
  useEffect(() => {
    if (rules.length === 0) return;
    
    const timer = setTimeout(async () => {
      try {
        await saveRules(rules);
        console.log("Configurazione salvata automaticamente.");
      } catch (err) {
        console.warn("Auto-salvataggio fallito:", err);
      }
    }, 2000); // Salva 2 secondi dopo l'ultima modifica

    return () => clearTimeout(timer);
  }, [rules]);

  const handleFileSelect = async (selectedFile: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const parsedData = await parseFile(selectedFile);
      
      if (!parsedData || parsedData.length === 0) {
        throw new Error("Il file sembra essere vuoto o non valido.");
      }
      
      const headers = Object.keys(parsedData[0]);
      const existingRules = await loadRules();
      const mappedRules = new Map(existingRules.map(r => [r.original_header, r]));
      
      const initialRules: ColumnRule[] = headers.map((header) => {
        if (mappedRules.has(header)) {
          return { ...mappedRules.get(header)! };
        }
        return {
          original_header: header,
          new_header: header,
          is_visible: true,
          position_index: 99999,
          numeric_transformation: 'none'
        };
      });
      
      initialRules.sort((a,b) => a.position_index - b.position_index);
      const normalizedRules = initialRules.map((r, i) => ({ ...r, position_index: i }));
      
      setRules(normalizedRules);
      setData(parsedData);
      setFile(selectedFile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore durante il caricamento del file.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      setIsExporting(true);
      await saveRules(rules);
      
      const blob = generateExcel(data, rules, startRow);
      if (!blob) throw new Error("Errore durante la generazione dell'Excel");
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file ? file.name.replace(/\.[^/.]+$/, "") + "_convertito.xlsx" : "convertito.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Impossibile generare il file Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setRules([]);
    setError(null);
  };

  const goToLanding = () => {
    setCurrentPath('landing');
    reset();
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      <header className="bg-card border-b sticky top-0 z-20 shadow-xs shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
          <button 
            onClick={goToLanding}
            className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
          >
            <div className="p-1.5 bg-primary/10 rounded">
              {currentPath === 'dbf-to-excel' ? <FileSpreadsheet size={18} /> : 
               currentPath === 'accrual' ? <Calculator size={18} /> : 
               <LayoutGrid size={18} />}
            </div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              {currentPath === 'dbf-to-excel' ? 'DBF to Excel Pro' : 
               currentPath === 'accrual' ? 'Accrual Manager' : 
               'Convert Suite'}
            </h1>
          </button>
          
          <div className="flex items-center gap-2">
            {currentPath !== 'landing' && (
              <button
                onClick={goToLanding}
                className="px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-full transition-all flex items-center gap-1.5 border"
              >
                <LayoutGrid size={12} />
                Menu Principale
              </button>
            )}
            {file && currentPath === 'dbf-to-excel' && (
              <button
                onClick={reset}
                className="px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-full transition-all flex items-center gap-1.5 border"
              >
                <RefreshCw size={12} />
                Nuovo File
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 flex flex-col min-h-0 overflow-auto">
        {currentPath === 'landing' && (
          <LandingPage onSelectPath={setCurrentPath} />
        )}

        {currentPath === 'dbf-to-excel' && (
          <div className="flex-1 flex flex-col py-4 min-h-0">
            {!file && !isLoading && (
              <div className="max-w-xl mx-auto w-full mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black tracking-tight mb-2">Convertitore DBF</h2>
                  <p className="text-sm text-muted-foreground">
                    Trasforma i tuoi dBase III in file Excel ordinati e pronti all'uso.
                  </p>
                </div>
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="font-semibold text-xs">{error}</p>
                  </div>
                )}
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            )}

            {isLoading && !file && (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in">
                <RefreshCw size={32} className="animate-spin mb-4 text-primary" />
                <p className="text-sm font-bold text-foreground">Caricamento in corso...</p>
              </div>
            )}

            {file && !isLoading && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 animate-in fade-in duration-300">
                <div className="lg:col-span-4 h-full flex flex-col bg-card rounded-xl border shadow-xs p-3 min-h-0">
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <RuleConfiguration 
                      rules={rules} 
                      onRulesChange={setRules}
                      startRow={startRow}
                      onStartRowChange={setStartRow}
                    />
                  </div>
                  
                  <div className="mt-3 pt-3 border-t shrink-0">
                    <button
                      onClick={handleGenerateExcel}
                      disabled={isExporting}
                      className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                      {isExporting ? 'Generazione...' : 'Esporta Excel'}
                    </button>
                  </div>
                </div>
                
                <div className="lg:col-span-8 h-full flex flex-col min-h-0">
                  <DataPreview data={data} rules={rules} />
                </div>
              </div>
            )}
          </div>
        )}

        {currentPath === 'accrual' && (
          <AccrualManager />
        )}
      </main>
    </div>
  );
}

export default App;
