import React, { useState, useEffect, useMemo } from 'react';
import type { ColumnRule } from '../types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Search } from 'lucide-react';

interface SortableRuleItemProps {
  rule: ColumnRule;
  displayIndex: number | null;
  onUpdate: (oldHeader: string, updates: Partial<ColumnRule>) => void;
  onMove: (oldHeader: string, newVisibleIndex: number) => void;
}

const SortableRuleItem: React.FC<SortableRuleItemProps> = React.memo(({ rule, displayIndex, onUpdate, onMove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.original_header });
  
  // Local state for the input to avoid global re-renders on every keystroke
  const [localHeader, setLocalHeader] = useState(rule.new_header);

  // Sync local state if rule changes from outside (e.g. initial load)
  useEffect(() => {
    setLocalHeader(rule.new_header);
  }, [rule.new_header]);

  const [isEditingIndex, setIsEditingIndex] = useState(false);
  const [localIndex, setLocalIndex] = useState(displayIndex?.toString() || "");

  useEffect(() => {
    setLocalIndex(displayIndex?.toString() || "");
  }, [displayIndex]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleBlur = () => {
    if (localHeader !== rule.new_header) {
      onUpdate(rule.original_header, { new_header: localHeader });
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-3 bg-card border rounded-lg shadow-sm mb-2 ${isDragging ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}`}>
      <div className="flex items-center gap-2 min-w-[60px]">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground p-1">
          <GripVertical size={20} />
        </div>
        {displayIndex !== null && (
          <div className="relative group/index">
            {isEditingIndex ? (
              <input
                autoFocus
                type="text"
                className="w-8 h-6 text-xs font-bold bg-primary text-primary-foreground text-center rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={localIndex}
                onChange={(e) => setLocalIndex(e.target.value)}
                onBlur={() => {
                  setIsEditingIndex(false);
                  const val = parseInt(localIndex);
                  if (!isNaN(val) && val !== displayIndex) {
                    onMove(rule.original_header, val);
                  } else {
                    setLocalIndex(displayIndex?.toString() || "");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') {
                    setIsEditingIndex(false);
                    setLocalIndex(displayIndex?.toString() || "");
                  }
                }}
              />
            ) : (
              <button 
                onClick={() => setIsEditingIndex(true)}
                className="text-xs font-bold bg-primary/20 text-primary w-6 h-6 flex items-center justify-center rounded-full shrink-0 hover:bg-primary hover:text-primary-foreground transition-all"
                title="Cambia posizione manuale"
              >
                {displayIndex}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 font-medium truncate text-sm" title={rule.original_header}>
          {rule.original_header}
        </div>
        
        <div className="col-span-6">
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border-input hover:border-accent"
            value={localHeader}
            onChange={(e) => setLocalHeader(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            placeholder="Nuova Intestazione"
            disabled={!rule.is_visible}
          />
        </div>
        
        <div className="col-span-2 flex justify-end">
          <button
            onClick={() => onUpdate(rule.original_header, { is_visible: !rule.is_visible })}
            className={`p-2 rounded-md transition-all ${rule.is_visible ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
            title={rule.is_visible ? "Nascondi colonna" : "Mostra colonna"}
          >
            {rule.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
});

SortableRuleItem.displayName = 'SortableRuleItem';

interface RuleConfigurationProps {
  rules: ColumnRule[];
  onRulesChange: (newRules: ColumnRule[]) => void;
  startRow: number;
  onStartRowChange: (row: number) => void;
}

export const RuleConfiguration: React.FC<RuleConfigurationProps> = ({ rules, onRulesChange, startRow, onStartRowChange }) => {
  const [search, setSearch] = useState("");
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sortedRules = useMemo(() => {
    return [...rules].sort((a, b) => a.position_index - b.position_index);
  }, [rules]);

  const filteredRules = useMemo(() => {
    if (!search) return sortedRules;
    const lowerSearch = search.toLowerCase();
    return sortedRules.filter(r => 
      r.original_header.toLowerCase().includes(lowerSearch) || 
      r.new_header.toLowerCase().includes(lowerSearch)
    );
  }, [sortedRules, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.original_header === active.id);
      const newIndex = rules.findIndex((r) => r.original_header === over.id);
      
      const newRules = arrayMove(rules, oldIndex, newIndex).map((r, index) => ({
        ...r,
        position_index: index
      }));
      onRulesChange(newRules);
    }
  };

  const handleUpdateRule = React.useCallback((originalHeader: string, updates: Partial<ColumnRule>) => {
    onRulesChange(rules.map(r => r.original_header === originalHeader ? { ...r, ...updates } : r));
  }, [rules, onRulesChange]);

  const handleMoveRule = React.useCallback((originalHeader: string, newVisibleIndex: number) => {
    // 1. Prendi la lista ordinata reale
    const currentOrder = [...rules].sort((a, b) => a.position_index - b.position_index);
    
    // 2. Trova l'indice attuale del record
    const currentIndex = currentOrder.findIndex(r => r.original_header === originalHeader);
    if (currentIndex === -1) return;

    // 3. Trova tutte le colonne visibili per mappare la "nuova posizione 5" alla posizione reale nel totale
    const visibleRules = currentOrder.filter(r => r.is_visible);
    
    // Clamp del nuovo indice per non uscire dai limiti
    const targetVisibleIndex = Math.max(1, Math.min(newVisibleIndex, visibleRules.length));
    const targetRule = visibleRules[targetVisibleIndex - 1];
    
    // Trova l'indice reale nel totale
    const targetIndex = currentOrder.findIndex(r => r.original_header === targetRule.original_header);
    
    if (currentIndex === targetIndex) return;

    const moved = arrayMove(currentOrder, currentIndex, targetIndex).map((r, index) => ({
      ...r,
      position_index: index
    }));
    
    onRulesChange(moved);
  }, [rules, onRulesChange]);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Configurazione Colonne</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">RIGA START EXCEL:</label>
            <input 
              type="number" 
              min="1" 
              className="w-16 px-2 py-1 text-sm border rounded-lg text-center bg-background focus:ring-2 focus:ring-primary/50 transition-all font-bold"
              value={startRow}
              onChange={(e) => onStartRowChange(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Cerca colonna..."
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 min-h-0 bg-muted/20 p-4 rounded-2xl border border-dashed overflow-y-auto custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rules.map(r => r.original_header)} strategy={verticalListSortingStrategy}>
            {filteredRules.length > 0 ? (
              filteredRules.map((rule) => {
                // Calcoliamo l'indice reale tra le sole colonne visibili nella lista totale ordinata
                const visibleIndex = sortedRules
                  .filter(r => r.is_visible)
                  .findIndex(r => r.original_header === rule.original_header);
                
                return (
                  <SortableRuleItem 
                    key={rule.original_header} 
                    rule={rule} 
                    displayIndex={rule.is_visible ? visibleIndex + 1 : null}
                    onUpdate={handleUpdateRule} 
                    onMove={handleMoveRule}
                  />
                );
              })
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm italic">
                Nessuna colonna trovata per "{search}"
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};
