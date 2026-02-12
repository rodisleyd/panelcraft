
import React from 'react';
import { ScriptData } from '../types';
import { MaterialIcon } from '../constants';

interface ScriptPreviewProps {
    script: ScriptData;
    onClose: () => void;
}

const ScriptPreview: React.FC<ScriptPreviewProps> = ({ script, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/95 backdrop-blur-sm animate-fade-in print:bg-white print:static print:block print:inset-auto">
            <div className="relative w-full h-full max-w-5xl bg-gray-100 dark:bg-brand-dark flex flex-col md:my-4 md:h-[95vh] md:rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 print:m-0 print:h-auto print:rounded-none print:shadow-none print:border-none print:block print:w-full transition-colors duration-300">
                {/* Top bar - Hidden on print */}
                <div className="px-4 md:px-8 py-3 md:py-4 border-b border-flat-grayDark/50 dark:border-white/10 flex items-center justify-between bg-white dark:bg-brand-dark sticky top-0 z-20 print:hidden">
                    <div className="flex items-center gap-2 md:gap-3">
                        <MaterialIcon name="description" className="text-brand-cyan text-sm md:text-base" />
                        <span className="font-black text-[10px] md:text-xs tracking-widest uppercase text-flat-black dark:text-white truncate">Visualização</span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 md:px-6 py-1.5 md:py-2 bg-brand-cyan text-white rounded-lg hover:bg-brand-dark dark:hover:bg-flat-cyan transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-brand-cyan/20"
                        >
                            <MaterialIcon name="download" className="text-xs md:text-sm" />
                            <span className="hidden sm:inline">Baixar PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 md:p-2 hover:bg-flat-dark dark:hover:bg-white/5 rounded-full transition-colors text-flat-grayMid hover:text-brand-pink"
                            aria-label="Voltar"
                        >
                            <MaterialIcon name="close" />
                        </button>
                    </div>
                </div>

                {/* Paper Content */}
                <div className="flex-1 overflow-auto p-2 md:p-12 bg-gray-200 dark:bg-black/20 custom-scrollbar print:p-0 print:bg-white print:overflow-visible flex flex-col items-center gap-8 print:block print:h-auto">

                    {/* Cover Page or Page 1 Content */}
                    <div className="flex flex-col gap-8 print:gap-0 print:block min-w-fit">
                        {script.pages.map((page, pageIdx) => (
                            <div key={page.id} className="bg-white shadow-2xl w-[210mm] max-w-[95vw] md:max-w-none min-h-[297mm] p-[10mm] md:p-[20mm] text-black font-sans leading-normal print:shadow-none print:p-[15mm] print:w-[210mm] print:min-h-[297mm] print:mb-0 page-break-content mx-auto origin-top transition-transform">

                                {/* Professional Header - Only on Page 1 or all? Let's do Page 1 and repeat small info on others if needed */}
                                {pageIdx === 0 && (
                                    <>
                                        <div className="flex justify-between items-start mb-12">
                                            <img src="https://i.ibb.co/LD0gPkTn/LOGO-PANELCRAFT-NOVO-PSITIVO.png" alt="PanelCraft" className="h-8 w-auto object-contain mb-2 print:h-10" />
                                            <div className="text-right">
                                                <span className="text-[12px] font-medium text-gray-500 italic">{script.treatment || 'Tratamento 1'}</span>
                                            </div>
                                        </div>

                                        <div className="text-center mb-16 space-y-2">
                                            <h1 className="text-4xl font-black uppercase tracking-tight text-black">{script.title || 'PROJETO SEM TÍTULO'}</h1>
                                            <p className="text-sm font-medium text-gray-600">Escritores: {script.author || 'Autor Desconhecido'}</p>
                                        </div>
                                    </>
                                )}

                                {pageIdx > 0 && (
                                    <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100 opacity-50">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{script.title}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Página {page.number}</span>
                                    </div>
                                )}

                                {/* Page Content */}
                                <div className="mb-0">
                                    {/* Page Indicator */}
                                    <div className="bg-[#00B5E2] text-white px-4 py-1 inline-block text-[12px] font-black uppercase tracking-widest mb-0">
                                        Página {page.number}
                                    </div>

                                    {page.panels.map((panel, idx) => (
                                        <div key={panel.id} className="mb-0 border-t-2 border-black first:border-t-0">
                                            {/* Panel Header */}
                                            <div className="bg-black text-white px-4 py-1 text-[12px] font-black uppercase tracking-widest">
                                                Painel {idx + 1}
                                            </div>

                                            {/* Table Structure */}
                                            <div className="grid grid-cols-3 border-x border-b border-black divide-x divide-black min-h-[120px]">
                                                {/* ACTION */}
                                                <div className="flex flex-col">
                                                    <div className="bg-[#D9D9D9] px-3 py-1 text-[11px] font-bold uppercase tracking-tight border-b border-black">
                                                        Ação
                                                    </div>
                                                    <div className="p-3 text-[12px] leading-relaxed font-medium">
                                                        {panel.action || '-'}
                                                    </div>
                                                </div>

                                                {/* DIALOGUES */}
                                                <div className="flex flex-col">
                                                    <div className="bg-[#D9D9D9] px-3 py-1 text-[11px] font-bold uppercase tracking-tight border-b border-black">
                                                        Diálogos
                                                    </div>
                                                    <div className="p-3 space-y-3 font-medium">
                                                        {panel.dialogues.map((d) => (
                                                            <div key={d.id} className="text-[12px]">
                                                                <span className="font-bold">{d.character}: </span>
                                                                <span>{d.text}</span>
                                                            </div>
                                                        ))}
                                                        {panel.dialogues.length === 0 && <span className="text-gray-400 italic">-</span>}
                                                    </div>
                                                </div>

                                                {/* CAPTIONS */}
                                                <div className="flex flex-col">
                                                    <div className="bg-[#D9D9D9] px-3 py-1 text-[11px] font-bold uppercase tracking-tight border-b border-black">
                                                        Legendas
                                                    </div>
                                                    <div className="p-3 text-[12px] italic leading-relaxed font-medium">
                                                        {panel.captions || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {pageIdx === script.pages.length - 1 && (
                                    <div className="pt-20 text-center opacity-30 print:hidden">
                                        <MaterialIcon name="adjust" className="text-xs" />
                                        <p className="text-[10px] font-bold uppercase tracking-[0.5em] mt-2">Fim do Roteiro</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {script.pages.length === 0 && (
                        <div className="text-center py-20 italic text-gray-400">
                            Nenhuma página para exibir.
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
          }
          /* Reset do container fixed para print */
          .fixed.inset-0.z-50 {
            position: static !important;
            display: block !important;
            background: white !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .animate-fade-in {
            animation: none !important;
          }
          .page-break-content {
            page-break-after: always !important;
            break-after: always !important;
            margin: 0 !important;
            border: none !important;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />
        </div>
    );
};

export default ScriptPreview;
