
import React, { useState } from 'react';
import { Reference } from '../types';
import { MaterialIcon } from '../constants';
import { compressImage, fileToBase64 } from '../utils/imageUtils';

interface ReferenceManagerProps {
    references: Reference[];
    onAdd: (ref: Reference) => void;
    onRemove: (id: string) => void;
    onShowAlert: (title: string, message: string) => void;
}

const ReferenceManager: React.FC<ReferenceManagerProps> = ({ references, onAdd, onRemove, onShowAlert }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [linkInput, setLinkInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAddLink = () => {
        if (!linkInput.trim()) return;
        const newRef: Reference = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'link',
            value: linkInput.trim()
        };
        onAdd(newRef);
        setLinkInput('');
        setShowAdd(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const base64 = await fileToBase64(file);
            const compressed = await compressImage(base64);

            const newRef: Reference = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'image',
                value: compressed,
                fileName: file.name
            };
            onAdd(newRef);
        } catch (err) {
            console.error("Error processing image", err);
            onShowAlert("Erro", "Erro ao processar imagem.");
        } finally {
            setIsProcessing(false);
            setShowAdd(false);
        }
    };

    return (
        <div className="mt-6 border-t border-flat-grayDark/30 dark:border-white/10 pt-4">
            <div className="flex items-center gap-3 mb-3">
                <label className="text-[10px] font-bold text-flat-grayMid dark:text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <MaterialIcon name="collections" className="text-sm" />
                    Referências Visuais
                </label>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full transition-all border ${showAdd ? 'bg-brand-pink text-white border-brand-pink' : 'bg-transparent text-flat-grayMid border-flat-grayDark/50 dark:border-white/10 hover:bg-flat-dark/10 dark:hover:bg-white/5'
                        }`}
                >
                    {showAdd ? 'Fechar' : 'Adicionar'}
                </button>
            </div>

            {showAdd && (
                <div className="bg-flat-dark/20 dark:bg-white/5 rounded-lg p-3 mb-4 border border-flat-grayDark/30 dark:border-white/10 animate-fade-in">
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="Cole um link (Pinterest, Drive, etc)"
                                className="flex-1 bg-white dark:bg-white/5 border border-flat-grayDark/50 dark:border-white/10 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-brand-cyan text-flat-black dark:text-white placeholder-flat-grayMid/40"
                            />
                            <button
                                onClick={handleAddLink}
                                className="bg-brand-cyan text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-transform active:scale-95"
                            >
                                Link
                            </button>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="ref-image-upload"
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="ref-image-upload"
                                className={`flex items-center justify-center gap-2 border-2 border-dashed border-flat-grayDark/50 dark:border-white/10 rounded-md py-4 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <MaterialIcon name={isProcessing ? 'sync' : 'image'} className={isProcessing ? 'animate-spin' : 'dark:text-white/20'} />
                                <span className="text-[10px] font-bold uppercase dark:text-white/40">
                                    {isProcessing ? 'Processando...' : 'Fazer Upload de Imagem'}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {references.map((ref) => (
                    <div key={ref.id} className="relative group aspect-square rounded-lg overflow-hidden border border-flat-grayDark/50 dark:border-white/10 bg-white dark:bg-white/5">
                        {ref.type === 'image' ? (
                            <img src={ref.value} alt="Reference" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-flat-dark/10 dark:bg-white/5">
                                <MaterialIcon name="link" className="text-brand-cyan mb-1" />
                                <span className="text-[8px] text-center break-all line-clamp-2 text-flat-grayMid dark:text-white/40 font-medium">
                                    {ref.value}
                                </span>
                                <a
                                    href={ref.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-brand-cyan/20 flex items-center justify-center transition-opacity"
                                >
                                    <MaterialIcon name="open_in_new" className="text-white" />
                                </a>
                            </div>
                        )}
                        <button
                            onClick={() => onRemove(ref.id)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-pink"
                        >
                            <MaterialIcon name="delete" className="text-[10px]" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReferenceManager;
