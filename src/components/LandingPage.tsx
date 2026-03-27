import React from 'react';
import { FileSpreadsheet, Calculator, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onSelectPath: (path: 'dbf-to-excel' | 'accrual') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectPath }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Benvenuto in Convert
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seleziona lo strumento di cui hai bisogno oggi per gestire i tuoi dati in modo efficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DBF to Excel Card */}
          <button
            onClick={() => onSelectPath('dbf-to-excel')}
            className="group relative bg-card hover:bg-accent border-2 border-border hover:border-primary/50 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 animate-in fade-in slide-in-from-left-4 duration-700 delay-100"
          >
            <div className="mb-6 inline-flex p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-300">
              <FileSpreadsheet size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3">DBF <span className="text-primary mx-1">↔</span> Excel</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Converti i tuoi file dBase III in fogli di calcolo Excel moderni. Gestisci colonne, rinomina intestazioni e personalizza l'esportazione.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              Inizia ora <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex h-3 w-3 rounded-full bg-primary animate-pulse"></span>
            </div>
          </button>

          {/* Accrual Card */}
          <button
            onClick={() => onSelectPath('accrual')}
            className="group relative bg-card hover:bg-accent border-2 border-border hover:border-primary/50 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 animate-in fade-in slide-in-from-right-4 duration-700 delay-200"
          >
            <div className="mb-6 inline-flex p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform duration-300">
              <Calculator size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3">Accrual</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Strumento per la gestione dei ratei e risconti. Analizza le competenze temporali e automatizza i calcoli contabili.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              Disponibile a breve <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
            
            <div className="absolute top-4 right-4">
              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase">Nuovo</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
