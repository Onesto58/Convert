import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnRule } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Search, Settings, X, Check, ArrowRight, Minus, Plus, RotateCw, PlusCircle, CheckCircle2, Layers } from 'lucide-react';

interface RuleSettingsModalProps {
  rule: ColumnRule;
  allRules: ColumnRule[];
  onClose: () => void;
  onUpdate: (updates: Partial<ColumnRule>) => void;
  onUpdateOther: (originalHeader: string, updates: Partial<ColumnRule>) => void;
}

const RuleSettingsModal: React.FC<RuleSettingsModalProps> = ({ rule, allRules, onClose, onUpdate, onUpdateOther }) => {
  const [search, setSearch] = useState("");
  const currentSumWith = useMemo(() => Array.isArray(rule.sum_with) ? rule.sum_with : [], [rule.sum_with]);

  console.log(`[Modal] Stato attuale per ${rule.original_header}: sum_with =`, currentSumWith);

  const displayColumns = useMemo(() => {
    const selected = allRules.filter(r => 
      r.original_header !== rule.original_header && 
      currentSumWith.includes(r.original_header)
    );

    const others = allRules.filter(r => 
      r.original_header !== rule.original_header && 
      !currentSumWith.includes(r.original_header) &&
      (r.original_header.toLowerCase().includes(search.toLowerCase()) || 
       r.new_header.toLowerCase().includes(search.toLowerCase()))
    );

    return [...selected, ...others];
  }, [allRules, rule.original_header, currentSumWith, search]);

  const toggleColumnInSum = (originalHeader: string) => {
    const isAdded = currentSumWith.includes(originalHeader);
    console.log(`[Modal] Click su ${originalHeader}. Già aggiunto? ${isAdded}`);
    
    if (isAdded) {
      const newVal = currentSumWith.filter(h => h !== originalHeader);
      console.log(`[Modal] Rimuovo ${originalHeader}. Nuovo array:`, newVal);
      onUpdate({ sum_with: newVal });
    } else {
      const newVal = [...currentSumWith, originalHeader];
      console.log(`[Modal] Aggiungo ${originalHeader}. Nuovo array:`, newVal);
      onUpdate({ sum_with: newVal });
      onUpdateOther(originalHeader, { is_visible: false });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-muted-foreground mr-1" />
            <h4 className="font-bold text-sm">Impostazioni: <span className="text-primary">{rule.original_header}</span></h4>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* TRASFORMAZIONE NUMERICA */}
          <section>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <RotateCw size={12} /> Segno Numerico
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'none', label: 'Nessuna', icon: <X size={14}/> },
                { id: 'always_positive', label: 'Sempre (+)', icon: <Plus size={14} className="text-green-500"/> },
                { id: 'always_negative', label: 'Sempre (-)', icon: <Minus size={14} className="text-red-500"/> },
                { id: 'invert', label: 'Inverti (+/-)', icon: <RotateCw size={14} className="text-blue-500"/> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdate({ numeric_transformation: opt.id as any })}
                  className={`flex items-center gap-3 p-2 rounded-xl border text-left transition-all ${rule.numeric_transformation === opt.id ? 'bg-primary/5 border-primary ring-1 ring-primary/20' : 'bg-background hover:bg-muted/30'}`}
                >
                  <div className={`p-1.5 rounded-lg ${rule.numeric_transformation === opt.id ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}>{opt.icon}</div>
                  <span className="text-xs font-bold leading-none">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* UNIFICA COLONNE (SOMMA) */}
          <section className="flex flex-col min-h-0">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Layers size={14} /> Unifica / Somma Colonne
            </h5>
            
            <div className="relative group/search mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" size={14} />
              <input
                type="text"
                placeholder="Cerca colonna..."
                className="w-full pl-9 pr-3 py-1.5 bg-muted/20 border-transparent focus:border-primary border-b rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/20 text-xs transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="border rounded-xl flex-1 overflow-y-auto custom-scrollbar bg-card divide-y">
              {displayColumns.length > 0 ? (
                displayColumns.map(col => {
                  const isAdded = currentSumWith.includes(col.original_header);
                  return (
                    <div key={col.original_header} className={`flex items-center justify-between p-2.5 transition-all ${isAdded ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                      <div className="min-w-0 pr-2">
                        <div className={`text-[11px] font-bold truncate leading-tight ${isAdded ? 'text-primary' : ''}`}>
                          {col.new_header}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate italic opacity-60 leading-tight">
                          {col.original_header}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleColumnInSum(col.original_header)}
                        className={`py-1 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                          isAdded 
                          ? 'bg-primary border-primary text-white shadow-sm' 
                          : 'bg-background border-input text-muted-foreground hover:border-primary hover:text-primary'
                        }`}
                      >
                        {isAdded ? "Aggiunta" : "Aggiungi"}
                        {isAdded ? <CheckCircle2 size={12} /> : <PlusCircle size={12} />}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-[10px] italic text-muted-foreground opacity-50">Nessuna colonna trovata</div>
              )}
            </div>
          </section>
        </div>

        <div className="p-4 bg-muted/10 border-t flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Check size={14} /> Concludi
          </button>
        </div>
      </div>
    </div>
  );
};

interface SortableRuleItemProps {
  rule: ColumnRule;
  allRules: ColumnRule[];
  displayIndex: number | null;
  onUpdate: (oldHeader: string, updates: Partial<ColumnRule>) => void;
  onMove: (oldHeader: string, newVisibleIndex: number) => void;
}

const SortableRuleItem: React.FC<SortableRuleItemProps> = React.memo(({ rule, allRules, displayIndex, onUpdate, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.original_header });
  const [localHeader, setLocalHeader] = useState(rule.new_header);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { setLocalHeader(rule.new_header); }, [rule.new_header]);

  const [isEditingIndex, setIsEditingIndex] = useState(false);
  const [localIndex, setLocalIndex] = useState(displayIndex?.toString() || "");
  useEffect(() => { setLocalIndex(displayIndex?.toString() || ""); }, [displayIndex]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleBlur = () => {
    if (localHeader !== rule.new_header) onUpdate(rule.original_header, { new_header: localHeader });
  };

  const hasSpecialSettings = (rule.numeric_transformation && rule.numeric_transformation !== 'none') || (rule.sum_with && rule.sum_with.length > 0);

  return (
    <>
      <div ref={setNodeRef} style={style} className={`flex items-center gap-2 p-1 bg-card border rounded shadow-xs mb-1 group/row ${isDragging ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''} ${!rule.is_visible ? 'opacity-70 bg-muted/30' : ''}`}>
        <div className="flex items-center gap-1 min-w-[50px] shrink-0">
          <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1">
            <GripVertical size={14} />
          </div>
          {displayIndex !== null && (
            <div className="relative group/index">
              {isEditingIndex ? (
                <input
                  autoFocus
                  type="text"
                  className="w-7 h-5 text-[10px] font-bold bg-primary text-primary-foreground text-center rounded outline-none"
                  value={localIndex}
                  onChange={(e) => setLocalIndex(e.target.value)}
                  onBlur={() => {
                    setIsEditingIndex(false);
                    const val = parseInt(localIndex);
                    if (!isNaN(val) && val !== displayIndex) onMove(rule.original_header, val);
                    else setLocalIndex(displayIndex?.toString() || "");
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                />
              ) : (
                <button 
                  onClick={() => setIsEditingIndex(true)}
                  className="text-[10px] font-bold bg-primary/10 text-primary w-5 h-5 flex items-center justify-center rounded shrink-0 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {displayIndex}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4 font-medium truncate text-[11px] text-muted-foreground/80 flex items-center gap-1" title={rule.original_header}>
            <span className="truncate">{rule.original_header}</span>
            <ArrowRight size={10} className="shrink-0 opacity-40" />
          </div>
          
          <div className="col-span-5">
            <input
              type="text"
              className="w-full px-1.5 py-0.5 text-xs border border-transparent hover:border-input focus:border-primary rounded bg-transparent focus:bg-background outline-none transition-all font-semibold"
              value={localHeader}
              onChange={(e) => setLocalHeader(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
              disabled={!rule.is_visible}
            />
          </div>
          
          <div className="col-span-3 flex justify-end gap-1 px-1">
            <button
              onClick={() => setShowSettings(true)}
              disabled={!rule.is_visible}
              className="p-1 rounded relative transition-all bg-transparent hover:bg-muted text-muted-foreground"
              title="Apri impostazioni avanzate"
            >
              <Settings size={14} />
              {hasSpecialSettings && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full ring-1 ring-background" />}
            </button>
            <button
              onClick={() => onUpdate(rule.original_header, { is_visible: !rule.is_visible })}
              className={`p-1 rounded transition-all ${rule.is_visible ? 'text-primary hover:bg-primary/5' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              {rule.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <RuleSettingsModal 
          allRules={allRules}
          rule={rule} 
          onClose={() => setShowSettings(false)} 
          onUpdate={(updates) => onUpdate(rule.original_header, updates)} 
          onUpdateOther={onUpdate}
        />
      )}
    </>
  );
});

SortableRuleItem.displayName = 'SortableRuleItem';

interface RuleConfigurationProps {
  rules: ColumnRule[];
  onRulesChange: React.Dispatch<React.SetStateAction<ColumnRule[]>>;
  startRow: number;
  onStartRowChange: (row: number) => void;
}

export const RuleConfiguration: React.FC<RuleConfigurationProps> = ({ rules, onRulesChange, startRow, onStartRowChange }) => {
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const sortedRules = useMemo(() => [...rules].sort((a, b) => a.position_index - b.position_index), [rules]);

  const filteredRules = useMemo(() => {
    let list = sortedRules;
    if (!showHidden) {
      list = list.filter(r => r.is_visible);
    }
    if (!search) return list;
    const lowerSearch = search.toLowerCase();
    return list.filter(r => 
      r.original_header.toLowerCase().includes(lowerSearch) || 
      r.new_header.toLowerCase().includes(lowerSearch)
    );
  }, [sortedRules, search, showHidden]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.original_header === active.id);
      const newIndex = rules.findIndex((r) => r.original_header === over.id);
      onRulesChange(arrayMove(rules, oldIndex, newIndex).map((r, index) => ({ ...r, position_index: index })));
    }
  };

  const handleUpdateRule = React.useCallback((originalHeader: string, updates: Partial<ColumnRule>) => {
    onRulesChange((prevRules: ColumnRule[]) => prevRules.map((r: ColumnRule) => r.original_header === originalHeader ? { ...r, ...updates } : r));
  }, [onRulesChange]);

  const handleMoveRule = React.useCallback((originalHeader: string, newVisibleIndex: number) => {
    onRulesChange((prevRules: ColumnRule[]) => {
      const currentOrder = [...prevRules].sort((a, b) => a.position_index - b.position_index);
      const currentIndex = currentOrder.findIndex(r => r.original_header === originalHeader);
      if (currentIndex === -1) return prevRules;
      const visibleRules = currentOrder.filter(r => r.is_visible);
      const targetVisibleIndex = Math.max(1, Math.min(newVisibleIndex, visibleRules.length));
      const targetRule = visibleRules[targetVisibleIndex - 1];
      const targetIndex = currentOrder.findIndex(r => r.original_header === targetRule.original_header);
      if (currentIndex === targetIndex) return prevRules;
      return arrayMove(currentOrder, currentIndex, targetIndex).map((r, index) => ({ ...r, position_index: index }));
    });
  }, [onRulesChange]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="space-y-2 mb-3 shrink-0 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configurazione Colonne</h3>
          <div className="flex items-center gap-1.5 focus-within:text-primary transition-colors">
            <label className="text-[9px] font-black leading-none opacity-60">RIGA START:</label>
            <input 
              type="number" 
              className="w-10 h-6 px-1 py-0.5 text-xs border rounded bg-background text-center font-black outline-none focus:ring-1 focus:ring-primary/40 border-input"
              value={startRow}
              onChange={(e) => onStartRowChange(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="relative group/search flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/search:text-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="Cerca colonne..."
              className="w-full pl-9 pr-3 py-1.5 bg-muted/20 border-transparent border-b-muted border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/20 text-xs transition-all hover:bg-muted/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-tight ${showHidden ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/10 border-transparent text-muted-foreground'}`}
            title={showHidden ? "Nascondi le colonne non selezionate" : "Mostra tutte le colonne"}
          >
            {showHidden ? <Eye size={12}/> : <EyeOff size={12}/>}
            {showHidden ? "Nascondi Escluse" : "Mostra Escluse"}
          </button>
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-muted/5 p-1 rounded-xl border border-dashed overflow-y-auto custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rules.map(r => r.original_header)} strategy={verticalListSortingStrategy}>
            <div className="space-y-[2px]">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  const visibleIndex = sortedRules.filter(r => r.is_visible).findIndex(r => r.original_header === rule.original_header);
                  return (
                    <SortableRuleItem 
                      key={rule.original_header} 
                      rule={rule} 
                      allRules={rules}
                      displayIndex={rule.is_visible ? visibleIndex + 1 : null} 
                      onUpdate={handleUpdateRule} 
                      onMove={handleMoveRule} 
                    />
                  );
                })
              ) : (
                <div className="py-10 text-center text-muted-foreground text-[11px] font-medium italic opacity-50">Nessun risultato</div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
