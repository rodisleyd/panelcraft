import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MaterialIcon } from '../constants';
import { getAIChatResponse, ChatMessage } from '../services/geminiService';
import { ScriptData, PanelData } from '../types';

interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    script: ScriptData;
    initialPrompt?: string;
    onApplyAction?: (updates: Partial<PanelData>) => void;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ isOpen, onClose, script, initialPrompt, onApplyAction }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const extractPanelUpdates = (text: string): Partial<PanelData> => {
        const updates: Partial<PanelData> = {};

        // Extrai Ação (suporta vários marcadores e emojis) - Adicionado \b para evitar casar com "opção" ou "provocação"
        const actionMatch = text.match(/(?:🎬|📝)?\s*(?:\*\*|###|#)?\s*\b(?:Ação|Action)\b\s*:?\s*\**\s*([\s\S]*?)(?=\n(?:\*\*|###|#|🎬|📝|💬|🎙️|📜|---)|$)/i);
        if (actionMatch) updates.action = actionMatch[1].trim();

        // Extrai Legenda (suporta vários marcadores e emojis) - Adicionado \b
        const captionMatch = text.match(/(?:💬|🎙️|📜)?\s*(?:\*\*|###|#)?\s*\b(?:Legenda|Caption|Narração)\b\s*:?\s*\**\s*([\s\S]*?)(?=\n(?:\*\*|###|#|🎬|📝|💬|🎙️|📜|---)|$)/i);
        if (captionMatch) updates.captions = captionMatch[1].trim();

        // Extrai Diálogos (Busca por Diálogo (PERSONAGEM): "Texto" ou PERSONAGEM: Texto)
        // O padrão agora suporta o formato específico: 💬 Diálogo (Nome): "Texto"
        const dialogueMatches = text.matchAll(/(?:💬|🗣️)?\s*(?:\*\*|###)?\s*(?:Diálogo\s*\(([^)]+)\)|([A-ZÀ-Úa-zà-ú\s]{2,}))\s*(?:\*\*|###)?\s*:\s*(?:["“])?([\s\S]*?)(?:["”])?(?=\n(?:\*\*|###|#|🎬|📝|💬|🎙️|📜|---)|$)/gi);
        
        const dialogues = Array.from(dialogueMatches).map(match => {
            const charName = (match[1] || match[2] || '').trim().toUpperCase();
            return {
                id: Math.random().toString(36).substr(2, 9),
                character: charName,
                text: match[3].trim()
            };
        });

        // Só adiciona se não for confundido com os cabeçalhos fixos (Ação, Legenda)
        if (dialogues.length > 0) {
            const filteredDialogues = dialogues.filter(d => 
                !['AÇÃO', 'ACTION', 'LEGENDA', 'CAPTION', 'NARRAÇÃO', 'OPÇÃO'].includes(d.character)
            );
            if (filteredDialogues.length > 0) updates.dialogues = filteredDialogues;
        }

        // Se não encontrar marcadores, mas o texto for curto e NÃO encontramos Diálogos ou Legendas, 
        // assume que o texto inteiro é a Ação (fallback para respostas simples)
        if (Object.keys(updates).length === 0 && text.length < 600 && !text.includes('OPÇÃO')) {
            updates.action = text.trim();
        }

        return updates;
    };

    // Função para renderizar o conteúdo da mensagem, dividindo em opções se necessário
    const renderMessageContent = (msg: ChatMessage, msgIndex: number) => {
        if (msg.role === 'user' || msgIndex === 0) {
            return (
                <div className={`
                    max-w-[90%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm markdown-content
                    ${msg.role === 'user'
                        ? 'bg-brand-dark dark:bg-flat-cyan text-white rounded-tr-none'
                        : 'bg-white dark:bg-white/10 border border-flat-grayDark/20 dark:border-white/10 text-flat-black dark:text-white rounded-tl-none font-medium'
                    }
                `}>
                    <ReactMarkdown>{msg.parts}</ReactMarkdown>
                </div>
            );
        }

        // Para mensagens do modelo (IA), tentamos dividir por opções
        // O geminiService usa "---" e "### OPÇÃO X"
        const segments = msg.parts.split(/---|\n(?=###?\s*OPÇÃO)/i).filter(s => s.trim().length > 0);

        return (
            <div className="space-y-4 w-full">
                {segments.map((segment, sIdx) => {
                    const isOption = segment.toUpperCase().includes('OPÇÃO');
                    const updates = extractPanelUpdates(segment);
                    const hasUpdates = Object.keys(updates).length > 0;
                    
                    return (
                        <div
                            key={sIdx}
                            className={`
                                relative max-w-[95%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm markdown-content group
                                bg-white dark:bg-white/10 border border-flat-grayDark/20 dark:border-white/10 text-flat-black dark:text-white rounded-tl-none font-medium
                                ${isOption ? 'border-l-4 border-l-brand-cyan' : ''}
                            `}
                        >
                            {/* Action Buttons - Top Right Floating */}
                            <div className="absolute -top-3 -right-2 flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10 max-w-[200px] justify-end">
                                <button
                                    onClick={() => copyToClipboard(segment, msgIndex + sIdx * 100)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-dark dark:bg-white text-white dark:text-brand-dark shadow-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                    title="Copiar este bloco"
                                >
                                    <MaterialIcon name={copiedIndex === (msgIndex + sIdx * 100) ? "check" : "content_copy"} className="text-[10px]" />
                                    {copiedIndex === (msgIndex + sIdx * 100) ? 'Copiado!' : 'Copiar'}
                                </button>
                                
                                {onApplyAction && (
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {updates.action && (
                                            <button
                                                onClick={() => onApplyAction({ action: updates.action })}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-cyan text-white shadow-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                title="Aplicar apenas Ação"
                                            >
                                                <MaterialIcon name="movie" className="text-[10px]" />
                                                Ação
                                            </button>
                                        )}
                                        {updates.dialogues && (
                                            <button
                                                onClick={() => onApplyAction({ dialogues: updates.dialogues })}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-pink text-white shadow-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                title="Aplicar apenas Diálogos"
                                            >
                                                <MaterialIcon name="forum" className="text-[10px]" />
                                                Diálogos
                                            </button>
                                        )}
                                        {updates.captions && (
                                            <button
                                                onClick={() => onApplyAction({ captions: updates.captions })}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-flat-grayLight text-white shadow-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                title="Aplicar apenas Legenda"
                                            >
                                                <MaterialIcon name="notes" className="text-[10px]" />
                                                Legenda
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mobile Visible Buttons */}
                            <div className="flex md:hidden flex-wrap items-center gap-2 mb-2 pb-1 border-b border-brand-cyan/10">
                                <button
                                    onClick={() => copyToClipboard(segment, msgIndex + sIdx * 100)}
                                    className="text-[8px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1"
                                >
                                    <MaterialIcon name="content_copy" className="text-[10px]" /> Copiar
                                </button>
                                {updates.action && (
                                    <button
                                        onClick={() => onApplyAction?.({ action: updates.action })}
                                        className="text-[8px] font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <MaterialIcon name="movie" className="text-[10px]" /> Ação
                                    </button>
                                )}
                                {updates.dialogues && (
                                    <button
                                        onClick={() => onApplyAction?.({ dialogues: updates.dialogues })}
                                        className="text-[8px] font-bold text-flat-pink uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <MaterialIcon name="forum" className="text-[10px]" /> Diálogos
                                    </button>
                                )}
                                {updates.captions && (
                                    <button
                                        onClick={() => onApplyAction?.({ captions: updates.captions })}
                                        className="text-[8px] font-bold text-flat-grayLight uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <MaterialIcon name="notes" className="text-[10px]" /> Legenda
                                    </button>
                                )}
                            <ReactMarkdown>{segment}</ReactMarkdown>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Efeito para resetar mensagens e aplicar prompt inicial quando abre
    useEffect(() => {
        if (isOpen) {
            const defaultMsg: ChatMessage = { role: 'model', parts: 'Olá! Sou seu assistente de roteiro. Como posso ajudar com "' + (script.title || 'seu projeto') + '" hoje?' };

            if (initialPrompt) {
                const userMsg: ChatMessage = { role: 'user', parts: initialPrompt };
                setMessages([defaultMsg, userMsg]);
                handlePrompt(initialPrompt, defaultMsg);
            } else {
                setMessages([defaultMsg]);
            }
        }
    }, [isOpen, initialPrompt]);

    const handlePrompt = async (prompt: string, welcomeMsg: ChatMessage) => {
        setIsLoading(true);
        const response = await getAIChatResponse([welcomeMsg, { role: 'user', parts: prompt }], script);
        setMessages(prev => [...prev, { role: 'model', parts: response }]);
        setIsLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const response = await getAIChatResponse([...messages, userMessage], script);

        setMessages(prev => [...prev, { role: 'model', parts: response }]);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white/80 dark:bg-brand-dark/90 backdrop-blur-xl border-l border-white/20 dark:border-white/10 shadow-2xl z-[100] flex flex-col animate-fade-in transition-colors duration-300">
            {/* Header */}
            <div className="p-4 border-b border-flat-grayDark/20 dark:border-white/10 flex items-center justify-between bg-brand-dark/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center shadow-lg shadow-brand-cyan/20">
                        <MaterialIcon name="smart_toy" className="text-white text-lg" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-flat-cyan">Assistente</h3>
                        <p className="text-xs font-bold text-flat-black dark:text-white">Refinar com IA</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-flat-grayLight dark:hover:bg-white/5 rounded-full transition-colors text-flat-grayMid dark:text-white/40"
                >
                    <MaterialIcon name="close" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-transparent">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
                    >
                        {renderMessageContent(msg, i)}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="bg-white dark:bg-white/10 border border-flat-grayDark/20 dark:border-white/10 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-flat-grayDark/20 dark:border-white/10 bg-white/50 dark:bg-brand-dark/50">
                <div className="relative">
                    <textarea
                        rows={2}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Pergunte algo sobre seu roteiro..."
                        className="w-full bg-white dark:bg-white/5 border border-flat-grayDark/30 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-medium focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan dark:focus:border-brand-cyan outline-none transition-all resize-none pr-12 text-flat-black dark:text-white placeholder-flat-grayMid/40"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`
              absolute right-2 bottom-2 p-2 rounded-lg transition-all
              ${input.trim() && !isLoading
                                ? 'bg-brand-cyan text-white shadow-lg shadow-brand-cyan/30 hover:scale-105'
                                : 'bg-flat-grayLight dark:bg-white/5 text-flat-grayMid dark:text-white/20'
                            }
            `}
                    >
                        <MaterialIcon name="send" className="text-sm" />
                    </button>
                </div>
                <p className="text-[8px] text-center text-flat-grayMid dark:text-white/20 mt-3 font-bold uppercase tracking-widest opacity-50">
                    Powered by Gemini 3 Flash
                </p>
            </div>
            <style>{`
                .markdown-content h3 {
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #0F172A;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    font-size: 0.8rem;
                    border-bottom: 2px solid rgba(0, 181, 226, 0.2);
                    padding-bottom: 4px;
                    display: block;
                }
                .dark .markdown-content h3 {
                    color: #F8FAFC;
                }
                .markdown-content p {
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }
                .markdown-content ul, .markdown-content ol {
                    margin-bottom: 1rem;
                    padding-left: 1.25rem;
                }
                .markdown-content li {
                    margin-bottom: 0.5rem;
                }
                .markdown-content strong {
                    color: #00B5E2;
                    font-weight: 900;
                }
                .markdown-content hr {
                    border: 0;
                    height: 1px;
                    background: linear-gradient(to right, transparent, rgba(0, 181, 226, 0.3), transparent);
                    margin: 1.5rem 0;
                }
            `}</style>
        </div>
    );
};

export default AIChatSidebar;
