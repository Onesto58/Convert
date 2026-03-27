import { Plus, Trash2, CheckCircle2, Circle, Settings2, Calculator } from 'lucide-react';
import type { AccrualRule } from '../../types';

interface AccrualConfiguratorProps {
  rules: AccrualRule[];
  onRulesChange: (rules: AccrualRule[]) => void;
}

const TYPES = ['ferie', 'ROL', 'festivita\'', '13a', '14a'];
const FIELDS = ['importo', 'contributi', 'inail'];

export const AccrualConfigurator: React.FC<AccrualConfiguratorProps> = ({ rules, onRulesChange }) => {

  const addRule = () => {
    const newRule: AccrualRule = {
      column_name: `Nuova Colonna ${rules.length + 1}`,
      selected_values: [],
      position_index: rules.length
    };
    onRulesChange([...rules, newRule]);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onRulesChange(newRules);
  };

  const updateRuleName = (index: number, name: string) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], column_name: name };
    onRulesChange(newRules);
  };

  const toggleValue = (ruleIndex: number, type: string, field: string) => {
    const value = `${type}.${field}`;
    const newRules = [...rules];
    const rule = { ...newRules[ruleIndex] };
    
    if (rule.selected_values.includes(value)) {
      rule.selected_values = rule.selected_values.filter((v: string) => v !== value);
    } else {
      rule.selected_values = [...rule.selected_values, value];
    }
    
    newRules[ruleIndex] = rule;
    onRulesChange(newRules);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings2 size={20} className="text-primary" />
          Configurazione Colonne Output
        </h3>
        <button
          onClick={addRule}
          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
        >
          <Plus size={16} />
          Aggiungi Colonna
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <div key={idx} className="bg-muted/30 border rounded-xl p-4 transition-all hover:border-primary/30">
              <div className="flex items-center justify-between gap-4 mb-4">
                <input
                  type="text"
                  value={rule.column_name}
                  onChange={(e) => updateRuleName(idx, e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none font-bold text-foreground py-1 flex-1 transition-all"
                  placeholder="Nome colonna..."
                />
                <button
                  onClick={() => removeRule(idx)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                {TYPES.map(type => (
                  <div key={type} className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{type}</p>
                    <div className="flex flex-col gap-1.5">
                      {FIELDS.map(field => {
                        const val = `${type}.${field}`;
                        const isSelected = rule.selected_values.includes(val);
                        return (
                          <button
                            key={field}
                            onClick={() => toggleValue(idx, type, field)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                              isSelected 
                                ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' 
                                : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                            }`}
                          >
                            <span className="capitalize">{field}</span>
                            {isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} className="opacity-30" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* STTFR Components */}
                <div className="space-y-2 bg-primary/5 p-2 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">STTFR</p>
                    <div className="flex flex-col gap-1.5">
                        {['dt_lic', 'tfr_da_riportare', 'quota_tfr_fondi_prev'].map(field => {
                            const val = `sttfr.${field}`;
                            const isSelected = rule.selected_values.includes(val);
                            return (
                                <button
                                    key={field}
                                    onClick={() => toggleValue(idx, 'sttfr', field)}
                                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
                                        isSelected 
                                            ? 'bg-primary/30 border-primary/40 text-primary shadow-sm' 
                                            : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                                    }`}
                                >
                                    <span className="text-[9px] truncate max-w-[80px]">{field.replace(/_/g, ' ')}</span>
                                    {isSelected ? <CheckCircle2 size={12} /> : <Circle size={12} className="opacity-30" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-muted-foreground/10 flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Calculator size={12} />
                    <span>Selezionati: <strong>{rule.selected_values.length}</strong> valori</span>
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl border-muted">
              <p className="text-muted-foreground text-sm">Nessuna colonna configurata. Clicca su "Aggiungi" per iniziare.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
