
import React, { useState } from 'react';
import { MaterialIcon } from '../constants';

interface CollaborationMenuProps {
    isOnline: boolean;
    roomId?: string;
    collaborators: any[];
    currentUserName: string;
    userId: string;
    onToggleOnline: () => void;
    onUpdateName: (name: string) => void;
}

const CollaborationMenu: React.FC<CollaborationMenuProps> = ({
    isOnline,
    roomId,
    collaborators,
    currentUserName,
    userId,
    onToggleOnline,
    onUpdateName
}) => {
    const [copied, setCopied] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(currentUserName);

    const [showJoinInput, setShowJoinInput] = useState(false);
    const [inviteLink, setInviteLink] = useState('');

    const copyInviteLink = () => {
        if (!roomId) return;
        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoinRoom = () => {
        if (!inviteLink) return;

        // Tenta extrair o ID da sala do link ou usa o ID direto
        let targetRoomId = inviteLink;
        try {
            const url = new URL(inviteLink);
            const params = new URLSearchParams(url.search);
            const roomFromUrl = params.get('room');
            if (roomFromUrl) targetRoomId = roomFromUrl;
        } catch (e) {
            // Se não for URL, assume que é o ID direto
        }

        if (targetRoomId) {
            window.location.search = `?room=${targetRoomId}`;
        }
    };

    return (
        <div className="flex items-center gap-3">
            {/* Lista de Avatares dos Colaboradores */}
            <div className="flex -space-x-1.5 hover:space-x-0.5 transition-all duration-300 mr-2 flex-shrink-0">
                {collaborators.map((user, i) => {
                    const isMe = user.id === userId;
                    return (
                        <div key={user.id || i} className="relative group cursor-help">
                            <div
                                onClick={() => isMe && setIsEditingName(true)}
                                className={`h-7 w-7 rounded-full ring-2 ring-white dark:ring-brand-dark flex items-center justify-center text-[10px] font-bold text-white shadow-premium transition-transform hover:scale-110 ${isMe ? 'cursor-pointer hover:ring-brand-cyan' : ''}`}
                                style={{ backgroundColor: user.color || '#ccc' }}
                            >
                                {user.name?.charAt(0).toUpperCase()}
                                {isMe && (
                                    <div className="absolute -top-1 -right-1 bg-brand-cyan rounded-full p-0.5 shadow-sm border border-white dark:border-brand-dark">
                                        <MaterialIcon name="edit" className="text-[6px] text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Tooltip Nativo em Tailwind para evitar quebra de CSS */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-[100] pointer-events-none">
                                <div className="bg-brand-dark text-white text-[9px] px-2 py-1 rounded shadow-2xl whitespace-nowrap font-black tracking-widest uppercase">
                                    {isMe ? `${user.name} (VOCÊ)` : (user.name || 'Escritor')}
                                    {/* Triângulo do Tooltip */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-brand-dark" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isOnline ? (
                <div className="flex items-center gap-2 animate-fade-in relative">
                    {/* Badge Ao Vivo Compacto */}
                    <div className="flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-1.5 rounded-lg shadow-sm">
                        <div className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse flex-shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-cyan hidden xl:inline">Ao Vivo</span>
                    </div>

                    <button
                        onClick={copyInviteLink}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-widest border shadow-sm ${copied
                            ? 'bg-brand-cyan text-white border-brand-cyan'
                            : 'bg-white dark:bg-white/5 text-flat-black dark:text-white border-flat-grayDark dark:border-white/10 hover:bg-flat-dark dark:hover:bg-white/10'
                            }`}
                    >
                        <MaterialIcon name={copied ? "check" : "share"} className="text-sm" />
                        <span className="hidden lg:inline">{copied ? "LINK COPIADO" : "ENVIAR LINK"}</span>
                    </button>

                    <button
                        onClick={onToggleOnline}
                        className="p-1.5 text-flat-grayMid dark:text-white/40 hover:text-brand-pink dark:hover:text-flat-cyan transition-colors bg-white dark:bg-white/5 border border-flat-grayDark dark:border-white/10 rounded-lg shadow-sm"
                        title="Sair do Modo Online"
                    >
                        <MaterialIcon name="cloud_off" className="text-sm" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    {showJoinInput ? (
                        <div className="flex items-center gap-2 bg-white dark:bg-brand-dark border border-brand-cyan/30 dark:border-brand-cyan/50 rounded-lg p-1 animate-fade-in shadow-xl ring-2 ring-brand-cyan/10">
                            <input
                                autoFocus
                                value={inviteLink}
                                onChange={(e) => setInviteLink(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                placeholder="Cole o link aqui..."
                                className="bg-transparent border-none focus:ring-0 text-[10px] font-bold text-flat-black dark:text-white w-32 xl:w-48 px-2 outline-none placeholder-flat-grayMid/40"
                            />
                            <button
                                onClick={handleJoinRoom}
                                className="p-1 bg-brand-cyan text-white rounded hover:bg-brand-dark transition-colors"
                            >
                                <MaterialIcon name="login" className="text-xs" />
                            </button>
                            <button
                                onClick={() => setShowJoinInput(false)}
                                className="p-1 text-flat-grayMid dark:text-white/40 hover:text-brand-pink"
                            >
                                <MaterialIcon name="close" className="text-xs" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onToggleOnline}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark dark:bg-flat-cyan text-white rounded-lg hover:bg-black dark:hover:bg-brand-dark transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-dark/20 group"
                                title="Ativar escrita em tempo real"
                            >
                                <MaterialIcon name="cloud_queue" className="text-sm" />
                                <span className="hidden 2xl:inline">Colaborar</span>
                            </button>

                            <button
                                onClick={() => setShowJoinInput(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-flat-grayLight/50 dark:bg-white/5 text-flat-black dark:text-white border border-flat-grayDark/50 dark:border-white/10 rounded-lg hover:bg-white dark:hover:bg-white/10 hover:border-brand-cyan transition-all font-black text-[10px] uppercase tracking-widest"
                                title="Entrar em uma sala existente"
                            >
                                <MaterialIcon name="group_add" className="text-sm" />
                                <span className="hidden 2xl:inline text-flat-grayMid dark:text-white/40 group-hover:text-brand-cyan">Entrar em Sala</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Modal Simples de Edição de Nome */}
            {isEditingName && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-dark/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-2xl shadow-2xl border border-flat-grayDark/20 dark:border-white/10 w-80">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-flat-cyan mb-4">Seu Nome de Escritor</h3>
                        <input
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (onUpdateName(tempName), setIsEditingName(false))}
                            className="w-full bg-flat-grayLight/30 dark:bg-white/5 border-b-2 border-flat-grayDark/20 dark:border-white/10 focus:border-brand-cyan py-2 text-lg font-bold text-flat-black dark:text-white outline-none transition-all placeholder-flat-grayMid/40 mb-6"
                            placeholder="Como quer ser chamado?"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => { onUpdateName(tempName); setIsEditingName(false); }}
                                className="flex-1 bg-brand-cyan text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-dark transition-all"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={() => { setTempName(currentUserName); setIsEditingName(false); }}
                                className="px-4 py-2 border border-flat-grayDark dark:border-white/10 text-flat-grayMid dark:text-white/40 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-flat-grayLight dark:hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollaborationMenu;
