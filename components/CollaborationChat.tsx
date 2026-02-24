
import React, { useState, useEffect, useRef } from 'react';
import { MaterialIcon } from '../constants';
import { ChatMessage } from '../types';
import * as syncService from '../services/firebaseService';
import { compressImage, fileToBase64 } from '../utils/imageUtils';

interface CollaborationChatProps {
    roomId: string;
    userId: string;
    userName: string;
    userColor: string;
    darkMode: boolean;
    onClose: () => void;
    onShowAlert: (title: string, message: string) => void;
    onShowConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const CollaborationChat: React.FC<CollaborationChatProps> = ({
    roomId,
    userId,
    userName,
    userColor,
    darkMode,
    onClose,
    onShowAlert,
    onShowConfirm
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        syncService.subscribeToMessages(roomId, (msgs) => {
            const sortedByTime = msgs.sort((a, b) => a.timestamp - b.timestamp);
            setMessages(sortedByTime);
        });
    }, [roomId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent, imageData?: string) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (isUploading) return;

        const messageText = newMessage.trim();
        if (!messageText && !imageData) return;

        console.log("Chat: Iniciando envio...", { hasText: !!messageText, hasImage: !!imageData });

        if (!syncService.db) {
            console.error("Chat Error: Firebase não inicializado");
            return;
        }

        try {
            setIsUploading(true); // Usamos o mesmo state para simplicidade
            await syncService.sendChatMessage(roomId, {
                userId,
                userName,
                userColor,
                text: messageText,
                image: imageData
            });
            console.log("Chat: Mensagem enviada com sucesso");
            setNewMessage('');
        } catch (err) {
            console.error("Chat Error ao enviar:", err);
            onShowAlert("Erro no Chat", "Infelizmente houve um erro ao enviar sua mensagem. Verifique sua conexão e tente novamente.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const base64 = await fileToBase64(file);
            const compressed = await compressImage(base64, 400, 0.6); // Miniatura para o chat
            handleSendMessage(undefined, compressed);
        } catch (err) {
            console.error("Error uploading image:", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        onShowConfirm(
            "Excluir Mensagem",
            "Deseja realmente apagar esta mensagem? Esta ação não pode ser desfeita.",
            async () => {
                try {
                    await syncService.deleteChatMessage(roomId, msgId);
                } catch (err) {
                    console.error("Error deleting message:", err);
                    onShowAlert("Erro ao Excluir", "Não foi possível apagar a mensagem no momento.");
                }
            }
        );
    };

    const handleStartEdit = (msg: ChatMessage) => {
        setEditingMessageId(msg.id);
        setEditValue(msg.text);
    };

    const handleSaveEdit = async () => {
        if (!editingMessageId) return;
        const trimmed = editValue.trim();
        if (!trimmed) {
            handleDeleteMessage(editingMessageId);
            setEditingMessageId(null);
            return;
        }

        try {
            await syncService.updateChatMessage(roomId, editingMessageId, trimmed);
            setEditingMessageId(null);
        } catch (err) {
            console.error("Error updating message:", err);
            onShowAlert("Erro ao Editar", "Não conseguimos salvar suas alterações agora.");
        }
    };

    const formatTime = (ts: number | null) => {
        if (!ts) return '';
        const date = new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`flex flex-col h-full ${darkMode ? 'bg-brand-dark' : 'bg-white'} border-l ${darkMode ? 'border-white/10' : 'border-flat-grayDark/50'} shadow-2xl animate-slide-in-right w-80`}>
            {/* Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-white/10' : 'border-flat-grayDark/50'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <MaterialIcon name="forum" className="text-brand-cyan" />
                    <span className="text-xs font-black uppercase tracking-widest">Sala de Chat</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-flat-dark/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                    <MaterialIcon name="close" className="text-sm" />
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                        <MaterialIcon name="chat_bubble_outline" className="text-4xl mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma mensagem ainda.<br />Comece a conversa!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.userId === userId;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end group' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    {!isMe && (
                                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: msg.userColor }}>
                                            {msg.userName}
                                        </span>
                                    )}
                                    <span className="text-[7px] opacity-40 font-bold">{formatTime(msg.timestamp)}</span>
                                    {isMe && !editingMessageId && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleStartEdit(msg)}
                                                className="p-0.5 text-flat-grayMid hover:text-brand-cyan transition-colors"
                                                title="Editar"
                                            >
                                                <MaterialIcon name="edit" className="text-[10px]" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                className="p-0.5 text-flat-grayMid hover:text-brand-pink transition-colors"
                                                title="Excluir"
                                            >
                                                <MaterialIcon name="delete" className="text-[10px]" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm ${isMe
                                    ? 'bg-brand-cyan text-white rounded-tr-none'
                                    : (darkMode ? 'bg-white/5 text-white rounded-tl-none border border-white/10' : 'bg-flat-dark/5 text-flat-black rounded-tl-none border border-flat-grayDark/40')
                                    }`}>
                                    {msg.image && (
                                        <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                            <img src={msg.image} alt="Upload" className="w-full h-auto block" />
                                        </div>
                                    )}
                                    {editingMessageId === msg.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSaveEdit();
                                                    } else if (e.key === 'Escape') {
                                                        setEditingMessageId(null);
                                                    }
                                                }}
                                                className="w-full bg-white/20 dark:bg-white/10 dark:text-white border-none rounded p-1 focus:ring-1 focus:ring-white outline-none text-[11px] min-h-[40px] resize-none"
                                            />
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setEditingMessageId(null)} className="text-[9px] uppercase font-bold opacity-60 hover:opacity-100">Cancelar</button>
                                                <button onClick={handleSaveEdit} className="text-[9px] uppercase font-bold text-white hover:underline">Salvar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.text.match(/https?:\/\/[^\s]+/g) ? (
                                                msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                                                    part.match(/https?:\/\/[^\s]+/) ? (
                                                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline transition-all break-all font-bold ${isMe ? 'text-white decoration-white/30 hover:decoration-white' : 'text-brand-cyan decoration-brand-cyan/30 hover:decoration-brand-cyan'}`}>
                                                            {part}
                                                        </a>
                                                    ) : part
                                                )
                                            ) : (msg.text || (msg.image && !msg.text ? '' : ''))}
                                            {msg.edited && (
                                                <span className="text-[7px] block mt-1 opacity-40 italic">(editada)</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Input Area */}
            {syncService.db ? (
                <form
                    onSubmit={handleSendMessage}
                    className={`p-4 border-t ${darkMode ? 'border-white/10' : 'border-flat-grayDark/50'}`}
                >
                    <div className={`relative flex items-center bg-flat-dark/5 dark:bg-white/5 rounded-xl border ${darkMode ? 'border-white/10' : 'border-flat-grayDark/40'} focus-within:border-brand-cyan transition-all`}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`p-2 ${isUploading ? 'opacity-30' : 'text-flat-grayMid hover:text-brand-cyan'} transition-colors`}
                        >
                            <MaterialIcon name={isUploading ? "sync" : "image"} className={isUploading ? "animate-spin" : ""} />
                        </button>
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={isUploading ? "Enviando imagem..." : "Escreva algo..."}
                            className="flex-1 bg-transparent border-none focus:ring-0 text-[11px] py-2.5 px-3 h-auto outline-none"
                            disabled={isUploading}
                        />
                        <button
                            type="submit"
                            disabled={isUploading || !newMessage.trim()}
                            className={`p-2 transition-transform active:scale-95 ${(!newMessage.trim() || isUploading) ? 'text-flat-grayMid opacity-30 cursor-not-allowed' : 'text-brand-cyan hover:scale-110'}`}
                            title="Enviar Mensagem (Enter)"
                        >
                            <MaterialIcon name="send" />
                        </button>
                    </div>
                </form>
            ) : (
                <div className="p-4 border-t bg-brand-pink/5 text-brand-pink text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">
                    <MaterialIcon name="warning" className="block text-lg mb-1" />
                    Firebase não configurado.<br />O chat está em modo demonstração.
                </div>
            )}
        </div>
    );
};

export default CollaborationChat;
