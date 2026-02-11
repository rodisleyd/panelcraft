
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MaterialIcon } from '../constants';
import { getAIChatResponse, ChatMessage } from '../services/geminiService';
import { ScriptData } from '../types';

interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    script: ScriptData;
    initialPrompt?: string;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ isOpen, onClose, script, initialPrompt }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div className={`
              max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm markdown-content
              ${msg.role === 'user'
                                ? 'bg-brand-dark dark:bg-flat-cyan text-white rounded-tr-none'
                                : 'bg-white dark:bg-white/10 border border-flat-grayDark/20 dark:border-white/10 text-flat-black dark:text-white rounded-tl-none font-medium'
                            }
            `}>
                            <ReactMarkdown>{msg.parts}</ReactMarkdown>
                        </div>
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
