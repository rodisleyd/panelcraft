
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScriptData, PageData, PanelData, ExportFormat } from './types';
import Sidebar from './components/Sidebar';
import PanelEditor from './components/PanelEditor';
import { MaterialIcon } from './constants';
import { suggestNewPanel } from './services/geminiService';
import ScriptPreview from './components/ScriptPreview';
import ReferencePreview from './components/ReferencePreview';
import CustomModal, { ModalConfig } from './components/CustomModal';
import AIChatSidebar from './components/AIChatSidebar';
import CollaborationMenu from './components/CollaborationMenu';
import * as syncService from './services/firebaseService';
import { Collaborator } from './types';

const LOCAL_STORAGE_KEY = 'panelcraft-script-v1';
const HISTORY_KEY = 'panelcraft-projects-history';
const DEFAULT_TITLE = 'Meu Novo Roteiro';

const App: React.FC = () => {
  const [script, setScript] = useState<ScriptData>({
    id: Math.random().toString(36).substr(2, 9),
    title: DEFAULT_TITLE,
    author: '',
    treatment: 'Tratamento 1',
    characters: [],
    pages: []
  });
  const [recentProjects, setRecentProjects] = useState<ScriptData[]>([]);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRefsPreview, setShowRefsPreview] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatPrompt, setAiChatPrompt] = useState<string | undefined>(undefined);
  const [isOnline, setIsOnline] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Impede que o mini-infobar padrão apareça no mobile
      e.preventDefault();
      // Guarda o evento para ser disparado depois
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('panelcraft-username');
    if (saved) return saved;
    return `Escritor ${Math.floor(Math.random() * 100)}`;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('panelcraft-darkmode');
    return saved === 'true';
  });

  const LOGO_LIGHT = "https://i.ibb.co/LD0gPkTn/LOGO-PANELCRAFT-NOVO-PSITIVO.png";
  const LOGO_DARK = "https://i.ibb.co/mV8MykGm/LOGO-PANELCRAFT-NOVO-NEGATIVO.png";

  useEffect(() => {
    localStorage.setItem('panelcraft-username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('panelcraft-darkmode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Alerta de recomendação para telas maiores (Mobile Only)
    const hasSeenNotice = localStorage.getItem('panelcraft-mobile-notice');
    const isMobile = window.innerWidth < 1024;

    if (isMobile && !hasSeenNotice) {
      setTimeout(() => {
        showAlert(
          "Dica de Experiência",
          "O PanelCraft foi projetado para telas maiores (Desktop). Você pode usar no celular, mas a experiência de edição profissional é muito melhor em telas grandes! 💻"
        );
        localStorage.setItem('panelcraft-mobile-notice', 'true');
      }, 2000);
    }
  }, []);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const showAlert = (title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmLabel: 'Sim, Continuar',
      cancelLabel: 'Cancelar',
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const loadProject = (project: ScriptData) => {
    setScript(project);
    setActivePanelId(null);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Data desconhecida';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  // Load from LocalStorage or URL Room
  useEffect(() => {
    // Load history
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setRecentProjects(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const urlRoomId = params.get('room');

    if (urlRoomId) {
      setIsOnline(true);
      setScript(prev => ({ ...prev, roomId: urlRoomId }));
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setScript(prev => ({
            ...prev,
            ...parsed,
            characters: parsed.characters || [],
            pages: (parsed.pages || []).map((p: any) => ({
              ...p,
              panels: (p.panels || []).map((panel: any) => ({
                ...panel,
                dialogues: panel.dialogues || []
              }))
            }))
          }));
        } catch (e) {
          console.error("Error loading script", e);
        }
      }
    }
  }, []);

  // Sync with Firebase Realtime
  useEffect(() => {
    if (isOnline && script.roomId) {
      syncService.joinRoom(
        script.roomId,
        userId,
        userName,
        (newData) => {
          // Sanitização: Firebase remove arrays vazios, precisamos restaurá-los
          const sanitizedData = {
            ...newData,
            characters: newData.characters || [],
            pages: (newData.pages || []).map((p: any) => ({
              ...p,
              panels: p.panels || []
            }))
          };

          setScript(prev => {
            const isDifferent = JSON.stringify(prev) !== JSON.stringify(sanitizedData);
            return isDifferent ? sanitizedData : prev;
          });
        },
        (users) => {
          setCollaborators(users as any);
        }
      );
    } else {
      syncService.leaveRoom(userId);
    }

    return () => syncService.leaveRoom(userId);
  }, [isOnline, script.roomId, userId, userName]);

  // Typing Status Logic
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStateRef = useRef<boolean>(false);
  const userColorRef = useRef<string>(`#${Math.floor(Math.random() * 16777215).toString(16)}`);

  const updateTypingStatus = useCallback((isTyping: boolean) => {
    if (!isOnline || !script.roomId || !userId) return;
    if (lastTypingStateRef.current === isTyping) return;

    lastTypingStateRef.current = isTyping;

    syncService.updatePresence(script.roomId, userId, {
      id: userId,
      name: userName,
      color: userColorRef.current,
      isTyping
    });
  }, [isOnline, script.roomId, userId, userName]);

  // Handle Typing Indicator on Script Change
  useEffect(() => {
    if (!isOnline) return;

    updateTypingStatus(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 1500);

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateTypingStatus(false); // Ensure 'not typing' status is sent on cleanup
    };
  }, [script.pages, isOnline, updateTypingStatus]);

  // Auto-save and Broadcast
  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedScript = { ...script, lastModified: Date.now() };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedScript));
      setLastSaved(new Date());

      // Update History
      if (script.pages.length > 0 || script.title !== DEFAULT_TITLE) {
        setRecentProjects(prev => {
          const filtered = prev.filter(p => p.id !== script.id);
          const newHistory = [updatedScript, ...filtered].slice(0, 10);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
          return newHistory;
        });
      }

      if (isOnline) {
        syncService.broadcastUpdate(script);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [script, isOnline]);

  const addPage = useCallback(() => {
    const newPage: PageData = {
      id: Math.random().toString(36).substr(2, 9),
      number: script.pages.length + 1,
      panels: []
    };
    setScript(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
  }, [script.pages.length]);

  const removePage = useCallback((pageId: string) => {
    setScript(prev => ({
      ...prev,
      pages: prev.pages
        .filter(p => p.id !== pageId)
        .map((p, i) => ({ ...p, number: i + 1 }))
    }));
  }, []);

  const addCharacter = useCallback(() => {
    const newChar = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Personagem',
      description: ''
    };
    setScript(prev => ({
      ...prev,
      characters: [...prev.characters, newChar]
    }));
  }, []);

  const updateCharacter = useCallback((id: string, field: 'name' | 'description', value: string) => {
    setScript(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setScript(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  }, []);

  const addPanel = useCallback(async (pageId: string, aiSuggest = false) => {
    setIsGenerating(aiSuggest);

    let aiContent = {
      action: '',
      dialogues: [{ id: 'd1', character: '', text: '' }],
      captions: ''
    };

    if (aiSuggest) {
      const context = JSON.stringify(script.pages.find(p => p.id === pageId)?.panels.slice(-2) || []);
      const chars = script.characters.map(c => c.name);
      const suggestion = await suggestNewPanel(context, chars);
      if (suggestion) {
        aiContent = {
          ...suggestion,
          dialogues: suggestion.dialogues.map((d: any) => ({
            ...d,
            id: Math.random().toString(36).substr(2, 9)
          }))
        };
      }
    }

    const newPanel: PanelData = {
      id: Math.random().toString(36).substr(2, 9),
      ...aiContent
    };

    setScript(prev => ({
      ...prev,
      pages: prev.pages.map(p =>
        p.id === pageId
          ? { ...p, panels: [...p.panels, newPanel] }
          : p
      )
    }));
    setActivePanelId(newPanel.id);
    setIsGenerating(false);

    setTimeout(() => {
      const el = document.getElementById(`panel-${newPanel.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = el.querySelector('textarea, input');
        (firstInput as HTMLElement)?.focus();
      }
    }, 150);
  }, [script]);

  const removePanel = useCallback((panelId: string) => {
    setScript(prev => ({
      ...prev,
      pages: prev.pages.map(p => ({
        ...p,
        panels: p.panels.filter(panel => panel.id !== panelId)
      }))
    }));
  }, []);

  const updatePanel = useCallback((panelId: string, field: keyof PanelData, value: any) => {
    setScript(prev => ({
      ...prev,
      pages: prev.pages.map(p => ({
        ...p,
        panels: p.panels.map(panel =>
          panel.id === panelId ? { ...panel, [field]: value } : panel
        )
      }))
    }));
  }, []);

  const exportScript = (format: ExportFormat) => {
    const filename = (script.title || 'Roteiro_Sem_Titulo').replace(/\s+/g, '_');
    const content = JSON.stringify(script, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_script.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importScript = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const content = JSON.parse(event.target.result);
          if (content.pages) {
            setScript(content);
            showAlert("Sucesso", "Roteiro importado com sucesso!");
          } else {
            showAlert("Erro", "Arquivo inválido. Formato não suportado.");
          }
        } catch (err) {
          showAlert("Erro", "Erro ao ler o arquivo JSON.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const deleteProject = (projectId: string) => {
    showConfirm(
      "Excluir Roteiro",
      "Tem certeza que deseja excluir este roteiro permanentemente? Esta ação não pode ser desfeita.",
      () => {
        setRecentProjects(prev => {
          const updated = prev.filter(p => p.id !== projectId);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          return updated;
        });

        // Se o roteiro atual for o deletado, limpa a tela para evitar edição de algo inexistente
        if (script.id === projectId) {
          setScript({
            id: Math.random().toString(36).substr(2, 9),
            title: DEFAULT_TITLE,
            author: '',
            treatment: 'Tratamento 1',
            characters: [],
            pages: []
          });
          setActivePanelId(null);
        }
      }
    );
  };

  const handleSelectPanel = (panelId: string) => {
    setActivePanelId(panelId);
    const el = document.getElementById(`panel-${panelId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNewScript = () => {
    showConfirm(
      "Novo Projeto",
      "Isso apagará o roteiro atual (mas não o que você salvou em JSON). Deseja continuar?",
      () => {
        setScript({
          id: Math.random().toString(36).substr(2, 9),
          title: DEFAULT_TITLE,
          author: '',
          treatment: 'Tratamento 1',
          characters: [],
          pages: []
        });
        setActivePanelId(null);
      }
    );
  };

  const isDefaultTitle = script.title === DEFAULT_TITLE;
  const isAuthorEmpty = script.author === '';

  const toggleCollaboration = () => {
    if (!syncService.db) {
      showAlert(
        "Configuração Necessária",
        "Para usar o Modo Colaborativo, você precisa configurar as chaves do Firebase no arquivo .env. Por enquanto, este modo está em demonstração de interface."
      );
      return;
    }

    if (!isOnline) {
      const newRoomId = Math.random().toString(36).substr(2, 12);
      setScript(prev => ({ ...prev, roomId: newRoomId }));
      setIsOnline(true);
      showAlert("Modo Colaborativo", "A sincronização foi ativada! Use o botão 'Enviar Link' para compartilhar o link com outros roteiristas.");
    } else {
      showConfirm(
        "Sair do Modo Online",
        "Deseja desativar a colaboração? As alterações futuras só serão salvas no seu computador.",
        () => {
          setIsOnline(false);
          setScript(prev => ({ ...prev, roomId: undefined }));
          // Limpar URL param sem recarregar
          const newUrl = window.location.pathname;
          window.history.pushState({}, '', newUrl);
        }
      );
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-brand-dark text-white' : 'bg-flat-bg text-flat-black'} selection:bg-brand-cyan/20 selection:text-brand-dark font-sans print:block print:h-auto print:overflow-visible transition-colors duration-300`}>
      {/* Sidebar */}
      {!focusMode && (
        <div className={`print:hidden fixed inset-y-0 left-0 z-[60] transform bg-white dark:bg-brand-dark transition-transform duration-300 xl:relative xl:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            script={script}
            activePanelId={activePanelId}
            onSelectPanel={(id) => {
              handleSelectPanel(id);
              setIsSidebarOpen(false); // Fecha sidebar ao selecionar painel em mobile
            }}
            onAddPage={addPage}
            onRemovePage={removePage}
            onAddCharacter={addCharacter}
            onUpdateCharacter={updateCharacter}
            onRemoveCharacter={removeCharacter}
            onImport={importScript}
            onNewScript={handleNewScript}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* Backdrop for Mobile Sidebar */}
      {isSidebarOpen && !focusMode && (
        <div
          className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 xl:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 ${darkMode ? 'bg-brand-dark' : 'bg-white'} print:hidden`}>
        {/* Header */}
        <header className={`h-20 flex-shrink-0 ${darkMode ? 'bg-brand-dark/80 border-white/10' : 'glass border-flat-grayDark/50'} border-b px-4 lg:px-8 flex items-center justify-between z-30 shadow-premium sticky top-0 transition-all`}>
          <div className="flex items-center gap-2 lg:gap-8 min-w-0">
            {/* Hamburger Menu (Mobile Only) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="xl:hidden p-2 rounded-lg hover:bg-flat-dark/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <MaterialIcon name="menu" className={darkMode ? 'text-white' : 'text-flat-black'} />
            </button>

            {/* Logo */}
            <img
              src={darkMode ? LOGO_DARK : LOGO_LIGHT}
              alt="PanelCraft Logo"
              className="h-7 lg:h-12 w-auto object-contain transition-opacity duration-300 flex-shrink-0"
            />

            <div className={`hidden sm:block h-8 w-[1px] ${darkMode ? 'bg-white/10' : 'bg-flat-grayDark/30'} mx-1`} />

            {/* Tratamento */}
            <div className="hidden lg:flex flex-col flex-shrink-0">
              <label className="text-[8px] font-black text-flat-cyan uppercase tracking-widest ml-1">TRT:</label>
              <input
                value={script.treatment || ''}
                onChange={(e) => setScript(prev => ({ ...prev, treatment: e.target.value }))}
                className={`${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white/50 border-flat-grayDark/50 text-flat-black'} border rounded-lg focus:border-brand-cyan focus:ring-4 focus:ring-brand-cyan/10 text-[10px] xl:text-xs font-black placeholder-flat-grayMid/40 w-36 xl:w-48 px-2 py-1 transition-all outline-none text-center`}
                placeholder="Tratamento"
              />
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5 lg:gap-3 flex-shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 lg:p-2.5 rounded-xl transition-all flex items-center justify-center hover:scale-110 active:scale-95 ${darkMode ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-flat-dark/50 text-flat-grayLight hover:bg-flat-dark'}`}
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              <MaterialIcon name={darkMode ? "light_mode" : "dark_mode"} className="text-lg lg:text-xl" />
            </button>

            <div className={`h-6 w-[1px] ${darkMode ? 'bg-white/10' : 'bg-flat-grayDark/50'} mx-0.5 lg:mx-2`} />

            <div className="hidden sm:block">
              <CollaborationMenu
                isOnline={isOnline}
                roomId={script.roomId}
                collaborators={collaborators}
                currentUserName={userName}
                userId={userId}
                onToggleOnline={toggleCollaboration}
                onUpdateName={setUserName}
              />
            </div>

            <div className={`hidden sm:block h-6 w-[1px] ${darkMode ? 'bg-white/10' : 'bg-flat-grayDark/50'} mx-1 xl:mx-2`} />

            <button
              onClick={() => {
                setAiChatPrompt(undefined);
                setShowAIChat(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-brand-cyan to-brand-cyan/80 text-white rounded-xl hover:from-brand-dark hover:to-brand-dark transition-all font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-brand-cyan/20 group"
            >
              <div className="bg-white/20 p-1 rounded-lg group-hover:scale-110 transition-transform">
                <MaterialIcon name="smart_toy" className="text-white text-xs" />
              </div>
              <span className="hidden xl:inline">IA</span>
            </button>

            <div className="flex items-center gap-1.5 lg:gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className={`flex items-center gap-2 px-2.5 py-1.5 lg:px-3 lg:py-1.5 border rounded transition-all shadow-sm ${darkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-flat-grayDark text-flat-black hover:bg-flat-dark'}`}
                title="Visualizar Roteiro"
              >
                <MaterialIcon name="visibility" className="text-sm text-brand-cyan" />
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Roteiro</span>
              </button>

              <button
                onClick={() => setShowRefsPreview(true)}
                className={`hidden lg:flex items-center gap-2 px-3 py-1.5 border rounded transition-all shadow-sm ${darkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-flat-grayDark text-flat-black hover:bg-flat-dark'}`}
                title="Guia de Referências"
              >
                <MaterialIcon name="collections" className="text-sm text-brand-pink" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Refs</span>
              </button>

              <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded transition-colors ${focusMode ? 'text-flat-cyan bg-flat-cyan/10' : (darkMode ? 'text-white/40 hover:bg-white/5' : 'text-flat-grayLight hover:bg-flat-dark')}`}
                title="Modo Foco"
              >
                <MaterialIcon name={focusMode ? "fullscreen_exit" : "fullscreen"} />
              </button>

              <div className="relative group">
                <button className={`p-2.5 border rounded transition-all flex items-center justify-center shadow-sm active:scale-95 ${darkMode ? 'bg-white/5 border-white/10 text-flat-cyan hover:bg-white/10' : 'bg-white border-flat-grayDark text-flat-cyan hover:bg-flat-dark'}`} title="Exportar Roteiro">
                  <MaterialIcon name="download" className="text-xl" />
                </button>
                <div className={`absolute right-0 mt-2 w-56 border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 overflow-hidden py-1 ${darkMode ? 'bg-brand-dark border-white/10' : 'bg-white border-flat-grayDark/50'}`}>
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-flat-cyan/10 text-flat-black'}`}
                  >
                    <MaterialIcon name="article" className="text-flat-cyan text-sm" />
                    PDF do Roteiro
                  </button>
                  <button
                    onClick={() => setShowRefsPreview(true)}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-flat-pink/10 text-flat-black'}`}
                  >
                    <MaterialIcon name="collections" className="text-flat-pink text-sm" />
                    PDF de Referências
                  </button>
                  <div className={`h-[1px] my-1 mx-4 ${darkMode ? 'bg-white/10' : 'bg-flat-grayDark/20'}`} />
                  <button
                    onClick={() => exportScript('FOUNTAIN')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-flat-grayDark/10 text-flat-black'}`}
                  >
                    <MaterialIcon name="code" className="text-flat-grayMid text-sm" />
                    Fountain Script
                  </button>
                  <button
                    onClick={() => exportScript('JSON')}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-white/5 text-white' : 'hover:bg-flat-grayDark/10 text-flat-black'}`}
                  >
                    <MaterialIcon name="data_object" className="text-flat-grayMid text-sm" />
                    JSON Structured
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Editor Area */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto p-4 md:p-8 xl:p-12 custom-scrollbar transition-all ${focusMode ? 'max-w-4xl mx-auto w-full' : ''}`}
        >
          {/* Typing Notification Floating Badge */}
          {isOnline && collaborators.some(c => c.id !== userId && c.isTyping) && (
            <div className="fixed bottom-8 right-8 z-[100] animate-bounce-soft">
              <div className="bg-brand-dark/90 backdrop-blur-md border border-brand-cyan/30 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
                <div className="flex -space-x-2">
                  {collaborators.filter(c => c.id !== userId && c.isTyping).map(c => (
                    <div
                      key={c.id}
                      className="w-6 h-6 rounded-full border-2 border-brand-dark flex items-center justify-center text-[8px] font-bold"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.name?.charAt(0)}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  {collaborators.filter(c => c.id !== userId && c.isTyping).length > 1
                    ? 'Vários estão escrevendo...'
                    : `${collaborators.find(c => c.id !== userId && c.isTyping)?.name} está escrevendo...`}
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Seção de Metadados do Roteiro (Nova Posição - Minimalismo Extremo) */}
          {!focusMode && (
            <div className="max-w-6xl mx-auto mb-6 animate-fade-in px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end border-b border-flat-grayDark/10 pb-4">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-black text-flat-cyan uppercase tracking-[0.2em] ml-1 opacity-60">Título</label>
                  <input
                    value={script.title}
                    onChange={(e) => setScript(prev => ({ ...prev, title: e.target.value }))}
                    className={`bg-transparent border-none focus:ring-0 text-sm xl:text-base font-black placeholder-flat-grayMid/30 py-0 transition-all outline-none ${darkMode ? 'text-white' : 'text-flat-black'}`}
                    placeholder="Nome do roteiro..."
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-[7px] font-black text-flat-cyan uppercase tracking-[0.2em] ml-1 opacity-60">Escritores</label>
                  <input
                    value={script.author}
                    onChange={(e) => setScript(prev => ({ ...prev, author: e.target.value }))}
                    className={`bg-transparent border-none focus:ring-0 text-[11px] xl:text-xs font-bold placeholder-flat-grayMid/30 py-0 transition-all outline-none ${darkMode ? 'text-white' : 'text-flat-black'}`}
                    placeholder="Quem escreveu?"
                  />
                </div>
              </div>
            </div>
          )}
          {script.pages.map((page) => (
            <div key={page.id} className="mb-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-flat-cyan to-flat-grayDark/20" />
                <span className="text-flat-cyan font-black text-2xl tracking-widest italic uppercase">PÁGINA {page.number}</span>
                <div className="h-[2px] flex-1 bg-gradient-to-l from-flat-cyan to-flat-grayDark/20" />
              </div>

              {page.panels?.map((panel, idx) => {
                // Coletar todos os nomes de personagens já usados no roteiro para auto-complete
                const dialogueChars = script.pages.flatMap(p =>
                  p.panels.flatMap(pan =>
                    pan.dialogues.map(d => d.character)
                  )
                );
                const allUniqueChars = Array.from(new Set([
                  ...script.characters.map(c => c.name),
                  ...dialogueChars
                ]))
                  .filter(Boolean)
                  .map(name => ({ name }));

                return (
                  <PanelEditor
                    key={panel.id}
                    panel={panel}
                    index={idx}
                    isActive={activePanelId === panel.id}
                    onUpdate={updatePanel}
                    onDelete={removePanel}
                    onAddPanel={addPanel}
                    pageId={page.id}
                    characters={allUniqueChars}
                    onShowAlert={showAlert}
                    onOpenAIChat={(prompt) => {
                      setAiChatPrompt(prompt);
                      setShowAIChat(true);
                    }}
                  />
                );
              })}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 opacity-80 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => addPanel(page.id)}
                  className={`flex items-center gap-2 px-6 py-3 border-2 border-dashed rounded-xl transition-all w-full sm:w-auto justify-center shadow-sm ${darkMode ? 'bg-white/5 border-white/10 text-white/40 hover:border-flat-cyan hover:text-flat-cyan hover:bg-white/10' : 'bg-white border-flat-grayDark text-flat-grayLight hover:border-flat-cyan hover:text-flat-cyan hover:bg-flat-cyan/5'}`}
                >
                  <MaterialIcon name="add" />
                  <span className="font-bold text-sm uppercase tracking-widest">Adicionar Painel</span>
                </button>
              </div>
            </div>
          ))}

          {script.pages.length === 0 && (
            <div className="max-w-5xl mx-auto py-16 px-6 animate-fade-in">
              <div className="mb-12 flex flex-col items-center text-center">
                <div className="px-3 py-1 bg-flat-cyan/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-flat-cyan mb-4">
                  Seja bem-vindo de volta
                </div>
                <h2 className={`text-3xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-flat-black'}`}>
                  Seus Roteiros
                </h2>
                <div className="h-1 w-12 bg-flat-cyan rounded-full mb-8" />
              </div>

              {recentProjects.length > 0 ? (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* New Project Card - First Item */}
                    <button
                      onClick={addPage}
                      className={`group relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:border-flat-cyan hover:bg-flat-cyan/5 min-h-[160px] ${darkMode ? 'bg-white/5 border-white/40 text-white/40 hover:text-flat-cyan' : 'bg-white border-flat-grayDark text-flat-grayLight hover:text-flat-cyan'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${darkMode ? 'bg-white/10 group-hover:bg-flat-cyan group-hover:text-white' : 'bg-flat-dark/50 group-hover:bg-flat-cyan group-hover:text-white'}`}>
                        <MaterialIcon name="add" className="text-xl" />
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-widest">Novo Roteiro</span>
                    </button>

                    {recentProjects.map((proj) => (
                      <button
                        key={proj.id}
                        onClick={() => loadProject(proj)}
                        className={`group relative border-2 rounded-2xl p-5 text-left transition-all flex flex-col gap-4 min-h-[160px] ${darkMode ? 'bg-white/5 border-white/40 hover:border-flat-cyan/50 hover:bg-white/10' : 'bg-white border-flat-grayDark/60 hover:border-flat-cyan hover:shadow-xl hover:shadow-flat-cyan/5'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${darkMode ? 'bg-white/10 group-hover:bg-flat-cyan/20' : 'bg-flat-dark/30 group-hover:bg-flat-cyan/10'}`}>
                            <MaterialIcon name="description" className={`text-xs transition-colors ${darkMode ? 'text-white/40 group-hover:text-flat-cyan' : 'text-flat-grayMid group-hover:text-flat-cyan'}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-full ${darkMode ? 'text-white/40 border-white/10' : 'text-flat-grayMid border-flat-grayDark/20'}`}>
                              {proj.pages.length} {proj.pages.length === 1 ? 'PÁG' : 'PÁGS'}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(proj.id);
                              }}
                              className={`p-1 rounded-md transition-all ${darkMode ? 'hover:bg-brand-pink/20 text-white/20 hover:text-brand-pink' : 'hover:bg-brand-pink/10 text-flat-grayLight hover:text-brand-pink'}`}
                              title="Excluir Roteiro"
                            >
                              <MaterialIcon name="delete" className="text-sm" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className={`font-black text-xs transition-colors line-clamp-2 leading-relaxed ${darkMode ? 'text-white group-hover:text-flat-cyan' : 'text-flat-black group-hover:text-flat-cyan'}`}>
                            {proj.title || 'Sem Título'}
                          </h4>
                        </div>

                        <div className={`mt-auto pt-3 border-t flex items-center justify-between ${darkMode ? 'border-white/5' : 'border-flat-grayDark/5'}`}>
                          <span className={`text-[8px] font-bold flex items-center gap-1 ${darkMode ? 'text-white/40' : 'text-flat-grayMid'}`}>
                            <MaterialIcon name="schedule" className="text-[9px]" />
                            {formatDate(proj.lastModified)}
                          </span>
                          <MaterialIcon name="north_east" className="text-[10px] text-flat-cyan opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-20 text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-white/5' : 'bg-flat-dark/50'}`}>
                    <MaterialIcon name="auto_stories" className={`text-4xl ${darkMode ? 'text-flat-cyan/20' : 'text-flat-cyan/30'}`} />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-flat-black'}`}>Nenhum roteiro ainda</h3>
                  <p className={`text-xs max-w-xs mb-8 ${darkMode ? 'text-white/40' : 'text-flat-grayMid'}`}>Comece sua primeira jornada épica para vê-la aparecer aqui.</p>
                  <button
                    onClick={addPage}
                    className="px-8 py-3 bg-flat-cyan text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-flat-black transition-all shadow-lg shadow-flat-cyan/20"
                  >
                    Começar Roteiro
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de Créditos */}
        <footer className={`flex-shrink-0 py-3 px-6 border-t text-center ${darkMode ? 'bg-brand-dark/50 border-white/5 text-white/30' : 'bg-white border-flat-grayDark/5'}`}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Desenvolvido por: © 2026 Rodisley Comunicação Visual
          </p>
        </footer>
      </main>

      {showPreview && (
        <ScriptPreview
          script={script}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showRefsPreview && (
        <ReferencePreview
          script={script}
          onClose={() => setShowRefsPreview(false)}
        />
      )}

      <div className="print:hidden">
        <AIChatSidebar
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          script={script}
          initialPrompt={aiChatPrompt}
        />
      </div>

      <div className="print:hidden">
        <CustomModal {...modalConfig} />
      </div>

      {/* PWA Install Button (Floating) */}
      {deferredPrompt && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce-subtle print:hidden group">
          <button
            onClick={async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                  setDeferredPrompt(null);
                }
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-brand-cyan text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase tracking-widest ring-4 ring-brand-cyan/20 border border-white/20"
          >
            <MaterialIcon name="install_desktop" className="text-lg" />
            <span>Instalar Desktop</span>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-brand-dark text-white text-[10px] px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap font-bold border border-white/10">
                Ter acesso rápido e usar offline 🚀
                <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-brand-dark" />
              </div>
            </div>
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${darkMode ? 'transparent' : '#FFFFFF'};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? 'rgba(255,255,255,0.1)' : '#E0E0E0'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00B5E2;
        }
      `}} />
    </div>
  );
};

export default App;
