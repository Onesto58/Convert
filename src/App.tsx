import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { RuleConfiguration } from './components/RuleConfiguration';
import { DataPreview } from './components/DataPreview';
import type { ColumnRule } from './types';
import { parseFile } from './utils/fileParser';
import { loadRules, saveRules } from './utils/ruleStorage';
import { generateExcel } from './utils/excelGenerator';
import { Download, RefreshCw, AlertCircle, FileSpreadsheet } from 'lucide-react';

function App() {
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
      console.log("Dati ottenuti da parser in App.tsx:", parsedData);
      
      if (!parsedData || parsedData.length === 0) {
        console.warn("Dati vuoti rilevati in App.tsx");
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
          position_index: 99999 // put new columns simply at the end initially
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
      
      try {
        await saveRules(rules);
      } catch (saveError) {
        console.error("Non è stato possibile salvare le regole sul DB", saveError);
      }
      
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="bg-card border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">DBF to Excel Pro</h1>
          </div>
          {file && (
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-full transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Carica nuovo file
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 flex flex-col">
        {!file && !isLoading && (
          <div className="max-w-2xl mx-auto w-full mt-24">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Ottimizza i tuoi flussi di dati</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Converti i file DBF in fogli Excel puliti e organizzati. Rinomina, riordina e riutilizza in automatico le tue configurazioni preferite.
              </p>
            </div>
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                <AlertCircle size={20} className="shrink-0" />
                <p className="font-medium text-sm">{error}</p>
              </div>
            )}
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {isLoading && !file && (
          <div className="flex flex-col items-center justify-center py-40 text-muted-foreground animate-in fade-in">
            <RefreshCw size={48} className="animate-spin mb-6 text-primary" />
            <p className="text-xl font-medium text-foreground mb-2">Lettura del file in corso...</p>
            <p className="text-sm">Analisi delle strutture e caricamento configurazioni</p>
          </div>
        )}

        {file && !isLoading && (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:min-h-[calc(100vh-160px)] animate-in fade-in duration-500">
            <div className="xl:col-span-4 h-full flex flex-col bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex-1 overflow-hidden flex flex-col">
                <RuleConfiguration 
                  rules={rules} 
                  onRulesChange={setRules}
                  startRow={startRow}
                  onStartRowChange={setStartRow}
                />
              </div>
              
              <div className="mt-8 pt-6 border-t shrink-0">
                <button
                  onClick={handleGenerateExcel}
                  disabled={isExporting}
                  className="w-full py-4 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 flex items-center justify-center gap-3 shadow-lg hover:shadow-primary/25 transition-all focus:ring-4 focus:ring-primary/20 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isExporting ? <RefreshCw size={22} className="animate-spin" /> : <Download size={22} />}
                  {isExporting ? 'Generazione in corso...' : 'Genera ed esporta Excel'}
                </button>
                <p className="text-xs text-center mt-4 text-muted-foreground font-medium">
                  Le tue regole verranno salvate e riapplicate al prossimo file.
                </p>
              </div>
            </div>
            
            <div className="xl:col-span-8 h-full min-h-[600px] xl:min-h-0 relative">
              <DataPreview data={data} rules={rules} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
