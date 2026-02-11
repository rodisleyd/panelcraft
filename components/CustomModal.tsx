
import React from 'react';
import { MaterialIcon } from '../constants';

export interface ModalConfig {
    isOpen: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

const CustomModal: React.FC<ModalConfig> = ({
    isOpen,
    type,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-brand-dark w-full max-w-md rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden transform animate-scale-in">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${type === 'alert' ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-brand-pink/10 text-brand-pink'}`}>
                            <MaterialIcon name={type === 'alert' ? 'info' : 'help_outline'} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-flat-black dark:text-white">
                            {title}
                        </h3>
                    </div>

                    <p className="text-sm text-flat-grayLight dark:text-white/60 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex items-center justify-end gap-3">
                        {type === 'confirm' && (
                            <button
                                onClick={onCancel}
                                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-flat-grayMid dark:text-white/40 hover:bg-flat-dark dark:hover:bg-white/5 transition-colors"
                            >
                                {cancelLabel}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${type === 'alert' ? 'bg-brand-cyan hover:bg-brand-dark' : 'bg-brand-pink hover:bg-brand-dark'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomModal;
