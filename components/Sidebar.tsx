
import React, { useState } from 'react';
import { ScriptData, PageData, PanelData } from '../types';
import { MaterialIcon } from '../constants';

interface SidebarProps {
  script: ScriptData;
  activePanelId: string | null;
  onSelectPanel: (panelId: string) => void;
  onAddPage: () => void;
  onRemovePage: (pageId: string) => void;
  onAddCharacter: () => void;
  onUpdateCharacter: (id: string, field: 'name' | 'description', value: string) => void;
  onRemoveCharacter: (id: string) => void;
  onImport: () => void;
  onNewScript: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  script,
  activePanelId,
  onSelectPanel,
  onAddPage,
  onRemovePage,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter,
  onImport,
  onNewScript,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPages = script.pages.filter(page => {
    if (!searchTerm) return true;

    // Busca por número de página
    const searchLower = searchTerm.toLowerCase();
    if (page.number.toString().includes(searchLower)) return true;
    if (`pagina ${page.number}`.includes(searchLower)) return true;
    if (`pág ${page.number}`.includes(searchLower)) return true;

    // Busca dentro dos painéis (ação e diálogos)
    return page.panels.some(panel =>
      panel.action.toLowerCase().includes(searchLower) ||
      panel.dialogues.some(d =>
        d.character.toLowerCase().includes(searchLower) ||
        d.text.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <aside className="w-80 xl:w-72 flex-shrink-0 bg-white dark:bg-brand-dark border-r border-flat-grayDark/50 dark:border-white/10 h-full flex flex-col overflow-hidden shadow-premium transition-colors duration-300">
      {/* Mobile Close Button */}
      {onClose && (
        <div className="xl:hidden flex justify-end p-2 bg-flat-dark/10 dark:bg-white/5 border-b border-flat-grayDark/30 dark:border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-flat-dark/20 dark:hover:bg-white/10 transition-colors text-flat-grayMid dark:text-white/40"
          >
            <MaterialIcon name="close" />
          </button>
        </div>
      )}

      <div className="p-6 border-b border-flat-grayDark/50 dark:border-white/10 flex items-center justify-between bg-flat-dark/30 dark:bg-white/5">
        <h2 className="text-xs font-black text-brand-cyan tracking-widest uppercase">ADICIONAR PÁGINA</h2>
        <button
          onClick={onAddPage}
          className="p-2 bg-brand-cyan text-white rounded-lg hover:bg-brand-dark transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-brand-cyan/20"
          title="Nova Página"
        >
          <MaterialIcon name="add" className="text-sm" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-b border-flat-grayDark/30 dark:border-white/10 bg-white dark:bg-brand-dark">
        <div className="relative group">
          <MaterialIcon
            name="search"
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-colors ${searchTerm ? 'text-brand-pink' : 'text-flat-grayMid'}`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ir para página ou buscar texto..."
            className="w-full bg-flat-dark/10 dark:bg-white/5 border border-flat-grayDark/20 dark:border-white/5 rounded-full pl-9 pr-4 py-2 text-[11px] focus:outline-none focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/10 transition-all text-flat-black dark:text-white placeholder-flat-grayMid/40 font-bold"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-flat-grayMid hover:text-brand-pink transition-colors"
            >
              <MaterialIcon name="close" className="text-xs" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {filteredPages.map((page) => (
          <div key={page.id} className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2 bg-brand-pink/10 dark:bg-brand-pink/5 rounded-xl group border border-brand-pink/20 dark:border-brand-pink/10">
              <span className="text-[10px] font-black text-brand-pink dark:text-brand-pink uppercase tracking-tighter">Página {page.number}</span>
              <button
                onClick={() => onRemovePage(page.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-brand-pink text-flat-grayMid"
              >
                <MaterialIcon name="delete" className="text-xs" />
              </button>
            </div>

            <div className="pl-4 space-y-1">
              {page.panels.map((panel, idx) => (
                <button
                  key={panel.id}
                  onClick={() => {
                    onSelectPanel(panel.id);
                    // No mobile, fecha a sidebar ao selecionar
                    if (window.innerWidth < 1280 && onClose) onClose();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group border border-transparent ${activePanelId === panel.id
                    ? 'bg-brand-dark dark:bg-flat-cyan text-white shadow-xl shadow-brand-dark/10'
                    : 'text-flat-grayLight dark:text-white/60 hover:bg-white dark:hover:bg-white/5 hover:border-flat-grayDark/50 dark:hover:border-white/10 hover:shadow-sm'
                    }`}
                >
                  <MaterialIcon name="view_quilt" className={`text-sm ${activePanelId === panel.id ? 'text-brand-cyan dark:text-white' : 'text-flat-grayMid group-hover:text-brand-cyan'}`} />
                  <span className="truncate font-semibold uppercase tracking-tight text-[11px]">Painel {idx + 1}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredPages.length === 0 && (
          <div className="text-center py-12 px-4 animate-fade-in">
            <MaterialIcon name="search_off" className="text-3xl text-flat-grayMid/20 mb-2" />
            <div className="text-flat-grayMid dark:text-white/20 text-[10px] font-black uppercase tracking-widest italic">
              {searchTerm ? 'Nenhuma página encontrada' : 'Nenhuma página adicionada.'}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-[8px] font-black text-brand-pink uppercase hover:underline"
              >
                Limpar Busca
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-flat-grayDark/50 dark:border-white/10 bg-flat-dark/10 dark:bg-white/5 space-y-2">
        <button
          onClick={onImport}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-white/5 border border-flat-grayDark/50 dark:border-white/10 rounded-xl text-flat-black dark:text-white hover:bg-flat-dark dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <MaterialIcon name="upload_file" className="text-sm text-brand-cyan" />
          Importar Roteiro
        </button>
        <button
          onClick={onNewScript}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-transparent border border-transparent rounded-xl text-flat-grayMid dark:text-white/40 hover:text-brand-pink dark:hover:text-flat-cyan transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <MaterialIcon name="add_circle_outline" className="text-sm" />
          Novo Projeto
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
