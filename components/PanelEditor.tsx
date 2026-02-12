
import React from 'react';
import { PanelData, DialogueEntry } from '../types';
import { UI_LABELS, MaterialIcon } from '../constants';
import { refineScriptContent } from '../services/geminiService';
import ReferenceManager from './ReferenceManager';
import { Reference } from '../types';

interface PanelEditorProps {
  panel: PanelData;
  index: number;
  onUpdate: (panelId: string, field: keyof PanelData, value: any) => void;
  onDelete: (panelId: string) => void;
  isActive: boolean;
  onAddPanel: (pageId: string) => void;
  pageId: string;
  characters: { name: string }[];
  onShowAlert: (title: string, message: string) => void;
  onOpenAIChat: (initialPrompt?: string) => void;
}

const PanelEditor: React.FC<PanelEditorProps> = ({ panel, index, onUpdate, onDelete, isActive, onAddPanel, pageId, characters, onShowAlert, onOpenAIChat }) => {
  const [isRefining, setIsRefining] = React.useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = React.useState(false);

  const handleRefine = async (field: 'action' | 'dialogue' | 'captions', dialogueId?: string) => {
    let textToRefine = "";
    if (field === 'dialogue' && dialogueId) {
      const entry = panel.dialogues.find(d => d.id === dialogueId);
      textToRefine = entry?.text || "";
    } else {
      textToRefine = (panel as any)[field] || "";
    }

    if (!textToRefine.trim()) {
      onOpenAIChat(`Pode me ajudar a criar o conteúdo para o campo **${field}** do painel ${index + 1}? Foque apenas neste campo.`);
      return;
    }

    onOpenAIChat(`Pode refinar especificamente o **${field}** do painel ${index + 1}? Ignore outros campos, foque apenas no refinamento deste texto: "${textToRefine}"`);
  };

  const actionRef = React.useRef<HTMLTextAreaElement>(null);
  const captionsRef = React.useRef<HTMLTextAreaElement>(null);
  const dialogueListRef = React.useRef<HTMLDivElement>(null);
  const dialoguesCountRef = React.useRef(panel.dialogues.length);

  React.useEffect(() => {
    if (panel.dialogues.length > dialoguesCountRef.current) {
      // Un novo diálogo foi adicionado
      setTimeout(() => {
        const inputs = dialogueListRef.current?.querySelectorAll('input');
        if (inputs && inputs.length > 0) {
          const lastInput = inputs[inputs.length - 1];
          (lastInput as HTMLInputElement).focus();
        }
      }, 50);
    }
    dialoguesCountRef.current = panel.dialogues.length;
  }, [panel.dialogues.length]);

  const addDialogueLine = () => {
    const newLine: DialogueEntry = {
      id: Math.random().toString(36).substr(2, 9),
      character: '',
      text: ''
    };
    onUpdate(panel.id, 'dialogues', [...panel.dialogues, newLine]);
  };

  const removeDialogueLine = (id: string) => {
    onUpdate(panel.id, 'dialogues', panel.dialogues.filter(d => d.id !== id));
  };

  const updateDialogueLine = (id: string, field: 'character' | 'text', value: string) => {
    const newDialogues = panel.dialogues.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    );
    onUpdate(panel.id, 'dialogues', newDialogues);
  };

  const handleAddReference = (ref: Reference) => {
    const currentRefs = panel.references || [];
    onUpdate(panel.id, 'references', [...currentRefs, ref]);
  };

  const handleRemoveReference = (id: string) => {
    const currentRefs = panel.references || [];
    onUpdate(panel.id, 'references', currentRefs.filter(r => r.id !== id));
  };

  return (
    <div
      id={`panel-${panel.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          onAddPanel(pageId);
        }
      }}
      className={`relative panel-card p-4 xl:p-8 mb-6 xl:mb-12 transition-all animate-fade-in outline-none ${isActive
        ? 'ring-2 ring-brand-cyan shadow-xl translate-y-[-4px]'
        : 'hover:translate-y-[-2px]'
        } dark:bg-white/5 dark:border-white/10`}
    >
      <div className="absolute -top-3 xl:-top-4 left-4 xl:left-6 px-2 xl:px-3 py-1 bg-white dark:bg-brand-dark border border-flat-grayDark/50 dark:border-white/10 rounded-full shadow-sm flex items-center gap-2 z-10">
        <span className="text-brand-cyan font-black text-[10px] xl:text-xs tracking-widest uppercase whitespace-nowrap">PAINEL {index + 1}</span>
        <button
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className={`transition-colors ml-1 xl:ml-2 p-1 rounded-md ${isNotesOpen ? 'bg-brand-pink text-white' : 'text-flat-grayMid hover:text-brand-pink'}`}
          title="Ver/Editar Notas"
        >
          <MaterialIcon name="sticky_note_2" className="text-xs xl:text-sm" />
          {panel.notes && !isNotesOpen && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-pink rounded-full border border-white dark:border-brand-dark" />
          )}
        </button>
        <button
          onClick={() => onDelete(panel.id)}
          className="text-flat-grayMid hover:text-brand-pink transition-colors ml-1"
          title="Excluir Painel"
        >
          <MaterialIcon name="delete" className="text-xs xl:text-sm" />
        </button>
      </div>

      {isNotesOpen && (
        <div className="mb-6 animate-slide-down">
          <div className="bg-brand-pink/5 dark:bg-brand-pink/10 border-2 border-dashed border-brand-pink/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <MaterialIcon name="description" className="text-brand-pink text-sm" />
              <label className="text-[10px] font-black text-brand-pink uppercase tracking-widest">Notas Colaborativas</label>
            </div>
            <textarea
              autoFocus
              value={panel.notes || ''}
              onChange={(e) => onUpdate(panel.id, 'notes', e.target.value)}
              placeholder="Escreva anotações ou recados para outros roteiristas aqui..."
              className="w-full bg-white dark:bg-white/5 border border-brand-pink/10 dark:border-white/10 rounded-xl p-3 text-sm min-h-[80px] focus:outline-none focus:border-brand-pink transition-all text-flat-black dark:text-white placeholder-brand-pink/30 font-medium"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6 pt-4">
        {/* ACTION COLUMN */}
        <div className="flex flex-col space-y-2 group">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-flat-grayLight dark:text-white/40 tracking-tighter uppercase">{UI_LABELS.action}</label>
            <button
              onClick={() => handleRefine('action')}
              disabled={isRefining === 'action'}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-flat-cyan hover:text-flat-black dark:hover:text-white disabled:animate-pulse"
              title="Refinar com IA"
            >
              <MaterialIcon name="auto_fix_high" className="text-xl" />
            </button>
          </div>
          <textarea
            ref={actionRef}
            value={panel.action}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const focusInput = dialogueListRef.current?.querySelector('input');
                if (focusInput) {
                  (focusInput as HTMLInputElement).focus();
                } else {
                  addDialogueLine();
                }
              }
            }}
            onChange={(e) => onUpdate(panel.id, 'action', e.target.value)}
            placeholder="O que acontece visualmente?"
            className="w-full bg-flat-dark/40 dark:bg-white/5 border border-flat-grayDark/50 dark:border-white/10 focus:border-brand-cyan focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-brand-cyan/5 rounded-xl p-4 text-base min-h-[160px] resize-none focus:outline-none transition-all text-flat-black dark:text-white placeholder-flat-grayMid/40 font-medium leading-relaxed"
          />
        </div>

        {/* DIALOGUE COLUMN */}
        <div className="flex flex-col space-y-3 group">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-flat-pink dark:text-flat-pink/80 tracking-tighter uppercase">{UI_LABELS.dialogue}</label>
            <button
              onClick={addDialogueLine}
              className="text-flat-pink hover:bg-flat-pink/10 p-1 rounded transition-colors"
              title="Adicionar Fala"
            >
              <MaterialIcon name="add_comment" className="text-3xl" />
            </button>
          </div>

          <div ref={dialogueListRef} className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {panel.dialogues.map((d) => (
              <div key={d.id} className="space-y-1 relative group/line border-l-2 border-flat-pink/20 pl-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-flat-pink/70 uppercase tracking-widest">Quem fala:</label>
                    <button
                      onClick={() => removeDialogueLine(d.id)}
                      className="opacity-0 group-hover/line:opacity-100 text-flat-grayMid hover:text-flat-pink transition-opacity"
                    >
                      <MaterialIcon name="close" className="text-sm" />
                    </button>
                  </div>
                  <input
                    value={d.character}
                    list={`chars-${panel.id}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextEl = e.currentTarget.parentElement?.nextElementSibling?.querySelector('textarea');
                        (nextEl as HTMLTextAreaElement)?.focus();
                      }
                    }}
                    onChange={(e) => updateDialogueLine(d.id, 'character', e.target.value)}
                    placeholder="Nome do personagem"
                    className="w-full text-sm font-bold uppercase tracking-wider bg-flat-dark/50 dark:bg-white/5 border-b border-flat-grayDark dark:border-white/10 focus:border-flat-pink focus:outline-none p-1.5 text-flat-black dark:text-white placeholder-flat-grayMid/30"
                  />
                  <datalist id={`chars-${panel.id}`}>
                    {characters.map((c, i) => (
                      <option key={i} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div className="relative group/text mt-2">
                  <textarea
                    value={d.text}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        captionsRef.current?.focus();
                      } else if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addDialogueLine();
                      }
                    }}
                    onChange={(e) => updateDialogueLine(d.id, 'text', e.target.value)}
                    placeholder="Fala do personagem..."
                    className="w-full bg-white dark:bg-white/5 border border-flat-grayDark/50 dark:border-white/10 focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 rounded-xl p-3 text-base min-h-[80px] resize-none focus:outline-none transition-all text-flat-black dark:text-white placeholder-flat-grayMid/40 font-medium leading-normal"
                  />
                  <button
                    onClick={() => handleRefine('dialogue', d.id)}
                    disabled={isRefining === d.id}
                    className="absolute right-2 bottom-2 opacity-0 group-hover/text:opacity-100 text-flat-pink hover:text-flat-black disabled:animate-pulse transition-opacity"
                    title="Refinar com IA"
                  >
                    <MaterialIcon name="auto_fix_high" className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
            {panel.dialogues.length === 0 && (
              <button
                onClick={addDialogueLine}
                className="w-full py-4 border-2 border-dashed border-flat-grayDark dark:border-white/10 text-flat-grayMid dark:text-white/20 rounded hover:border-flat-pink hover:text-flat-pink dark:hover:border-flat-pink/50 transition-all text-sm uppercase font-bold"
              >
                Clique para adicionar diálogo
              </button>
            )}
          </div>
        </div>

        {/* CAPTIONS COLUMN */}
        <div className="flex flex-col space-y-2 group">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-flat-grayMid dark:text-white/40 tracking-tighter uppercase">{UI_LABELS.captions}</label>
            <button
              onClick={() => handleRefine('captions')}
              disabled={isRefining === 'captions'}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-flat-grayLight dark:text-white/40 hover:text-flat-black dark:hover:text-white disabled:animate-pulse"
              title="Refinar com IA"
            >
              <MaterialIcon name="auto_fix_high" className="text-xl" />
            </button>
          </div>
          <textarea
            ref={captionsRef}
            value={panel.captions}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                onAddPanel(pageId);
              }
            }}
            onChange={(e) => onUpdate(panel.id, 'captions', e.target.value)}
            placeholder="Notas de narração..."
            className="w-full bg-white dark:bg-white/5 border border-flat-grayDark dark:border-white/10 focus:border-flat-grayMid dark:focus:border-white/30 rounded p-3 text-base min-h-[140px] italic resize-none focus:outline-none transition-colors text-flat-black dark:text-white placeholder-flat-grayMid/30 font-medium"
          />
        </div>
      </div>

      {/* REFERENCES SECTION */}
      <ReferenceManager
        references={panel.references || []}
        onAdd={handleAddReference}
        onRemove={handleRemoveReference}
        onShowAlert={onShowAlert}
      />
    </div>
  );
};

export default PanelEditor;
