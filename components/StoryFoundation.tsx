
import React, { useState } from 'react';
import { MaterialIcon } from '../constants';
import { ScriptData, Beat } from '../types';
import { extractTextFromFile } from '../utils/fileUtils';
import { generateOutlineFromTreatment } from '../services/geminiService';

interface StoryFoundationProps {
    isOpen: boolean;
    onClose: () => void;
    script: ScriptData;
    onUpdate: (data: Partial<ScriptData>) => void;
    darkMode: boolean;
}

const StoryFoundation: React.FC<StoryFoundationProps> = ({ isOpen, onClose, script, onUpdate, darkMode }) => {
    const [activeTab, setActiveTab] = useState<'argumento' | 'escaleta'>('argumento');
    const [isProcessing, setIsProcessing] = useState(false);
    const [targetPages, setTargetPages] = useState(24);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const text = await extractTextFromFile(file);
            onUpdate({ treatment: text });
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleGenerateOutline = async () => {
        if (!script.treatment) {
            alert("Por favor, forneça o argumento primeiro.");
            return;
        }

        setIsProcessing(true);
        try {
            const result = await generateOutlineFromTreatment(script.treatment, targetPages);
            if (result && result.outline) {
                onUpdate({ outline: result.outline });
                setActiveTab('escaleta');
            }
        } catch (error: any) {
            alert("Erro ao gerar escaleta: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateBeat = (page: number, content: string) => {
        const newOutline = [...(script.outline || [])];
        const index = newOutline.findIndex(b => b.page === page);
        if (index >= 0) {
            newOutline[index] = { ...newOutline[index], content };
        } else {
            newOutline.push({ page, content });
        }
        onUpdate({ outline: newOutline.sort((a, b) => a.page - b.page) });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border flex flex-col transform animate-scale-in ${darkMode ? 'bg-brand-dark border-white/10' : 'bg-white border-flat-grayDark/50'
                }`}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-cyan/20 rounded-xl">
                            <MaterialIcon name="architecture" className="text-brand-cyan" />
                        </div>
                        <div>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-white' : 'text-flat-black'}`}>
                                Argumento & Escaleta
                            </h2>
                            <p className="text-[10px] text-flat-grayMid font-bold uppercase tracking-tight">Alicerce da História</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                // Feedback visual de salvo
                                alert("Alterações sincronizadas e salvas!");
                            }}
                            className="px-4 py-2 bg-brand-cyan text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all flex items-center gap-2"
                        >
                            <MaterialIcon name="save" className="text-sm" />
                            Salvar
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-flat-grayMid">
                            <MaterialIcon name="close" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 flex gap-4 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('argumento')}
                        className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'argumento' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-flat-grayMid hover:text-white/60'
                            }`}
                    >
                        1. Argumento
                    </button>
                    <button
                        onClick={() => setActiveTab('escaleta')}
                        className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'escaleta' ? 'border-brand-pink text-brand-pink' : 'border-transparent text-flat-grayMid hover:text-white/60'
                            }`}
                    >
                        2. Escaleta (Outline)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {activeTab === 'argumento' ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-white/60' : 'text-flat-black/60'}`}>
                                    Texto do Argumento
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { if (confirm("Limpar todo o texto do argumento?")) onUpdate({ treatment: '' }) }}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase hover:bg-red-500/20 transition-all text-red-500"
                                    >
                                        <MaterialIcon name="delete_sweep" className="text-sm" />
                                        Limpar
                                    </button>
                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-white/10 transition-all text-flat-cyan">
                                        <MaterialIcon name="upload_file" className="text-sm" />
                                        Upload
                                        <input type="file" className="hidden" accept=".pdf,.txt,.docx" onChange={handleFileUpload} disabled={isProcessing} />
                                    </label>
                                </div>
                            </div>

                            <textarea
                                value={script.treatment || ''}
                                onChange={(e) => onUpdate({ treatment: e.target.value })}
                                placeholder="Descreva aqui o argumento completo da sua história..."
                                className={`w-full h-96 p-4 rounded-2xl border outline-none focus:ring-4 focus:ring-brand-cyan/10 transition-all text-xs leading-relaxed font-medium ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/20' : 'bg-flat-dark/30 border-flat-grayDark/50 text-flat-black placeholder-flat-grayMid/40'
                                    }`}
                            />

                            <div className="flex items-center justify-between p-4 bg-brand-cyan/5 border border-brand-cyan/10 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-cyan/20 rounded-2xl">
                                        <MaterialIcon name="auto_fix_high" className="text-brand-cyan" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-brand-cyan/80 uppercase tracking-tight">Gerador de Escaleta</p>
                                        <p className="text-[9px] text-flat-grayMid font-medium max-w-xs">A IA transformará seu argumento em batidas de páginas.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                        <label className="text-[8px] font-black text-brand-cyan uppercase mb-1">Páginas</label>
                                        <input
                                            type="number"
                                            value={targetPages}
                                            onChange={(e) => setTargetPages(parseInt(e.target.value))}
                                            className={`w-16 rounded-lg p-1 text-center text-xs font-bold outline-none border transition-all ${darkMode ? 'bg-white/10 border-white/10 text-white' : 'bg-flat-dark/10 border-flat-grayDark/50 text-flat-black'
                                                }`}
                                        />
                                    </div>
                                    <button
                                        onClick={handleGenerateOutline}
                                        disabled={isProcessing}
                                        className="px-6 py-3 bg-brand-cyan text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all disabled:opacity-50 shadow-lg shadow-brand-cyan/20"
                                    >
                                        {isProcessing ? 'Processando...' : 'Gerar Escaleta com IA'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-white/60' : 'text-flat-black/60'}`}>
                                    Escaleta Página a Página
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.print()}
                                        className={`flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase hover:bg-white/10 transition-all ${darkMode ? 'text-white/60' : 'text-flat-black/60'}`}
                                    >
                                        <MaterialIcon name="print" className="text-sm" />
                                        Imprimir
                                    </button>
                                    <p className="flex items-center px-4 py-2 bg-brand-pink/10 border border-brand-pink/20 rounded-xl text-[9px] font-bold text-brand-pink uppercase">
                                        {script.outline?.length || 0} Batidas
                                    </p>
                                </div>
                            </div>

                            {!script.outline || script.outline.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <MaterialIcon name="auto_stories" className="text-3xl text-white/10 mb-2" />
                                    <p className="text-xs text-white/20 font-bold uppercase tracking-widest">Nenhuma batida registrada. Vá para "Argumento" para gerar.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {script.outline.map((beat) => (
                                        <div key={beat.page} className={`p-4 rounded-2xl border flex gap-4 items-start transition-all ${darkMode ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-flat-grayDark/30 hover:shadow-md'
                                            }`}>
                                            <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[8px] font-black text-brand-pink uppercase">Pág</span>
                                                <span className="text-sm font-black text-brand-pink">{beat.page}</span>
                                            </div>
                                            <textarea
                                                value={beat.content}
                                                onChange={(e) => updateBeat(beat.page, e.target.value)}
                                                className={`flex-1 bg-transparent border-none outline-none resize-none text-[11px] font-bold leading-relaxed ${darkMode ? 'text-white' : 'text-flat-black'
                                                    }`}
                                                rows={2}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryFoundation;
