
import React from 'react';
import { ScriptData } from '../types';
import { MaterialIcon } from '../constants';

interface ReferencePreviewProps {
    script: ScriptData;
    onClose: () => void;
}

const ReferencePreview: React.FC<ReferencePreviewProps> = ({ script, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    // Coletar todos os painéis que possuem referências
    const panelsWithRefs = script.pages.flatMap(page =>
        page.panels
            .map((panel, idx) => ({
                ...panel,
                pageNumber: page.number,
                panelNumber: idx + 1
            }))
            .filter(panel => panel.references && panel.references.length > 0)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/95 backdrop-blur-sm animate-fade-in print:bg-white print:p-0">
            <div className="relative w-full h-full max-w-5xl bg-gray-100 dark:bg-brand-dark flex flex-col md:my-4 md:h-[95vh] md:rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 print:m-0 print:h-auto print:rounded-none print:shadow-none print:border-none transition-colors duration-300">
                {/* Top bar - Hidden on print */}
                <div className="px-8 py-4 border-b border-flat-grayDark/50 dark:border-white/10 flex items-center justify-between bg-white dark:bg-brand-dark sticky top-0 z-20 print:hidden">
                    <div className="flex items-center gap-3">
                        <MaterialIcon name="collections" className="text-brand-cyan" />
                        <span className="font-black text-xs tracking-widest uppercase text-flat-black dark:text-white">Guia de Referências Visuais</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-flat-dark dark:bg-white/10 text-white rounded-lg hover:bg-brand-dark dark:hover:bg-white/20 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <MaterialIcon name="print" className="text-sm" />
                            Imprimir
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-5 py-2 bg-brand-pink text-white rounded-lg hover:bg-brand-dark transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-pink/20"
                        >
                            <MaterialIcon name="picture_as_pdf" className="text-sm" />
                            Salvar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-flat-dark dark:hover:bg-white/10 rounded-full transition-colors text-flat-grayMid dark:text-white/40 hover:text-brand-pink ml-2"
                        >
                            <MaterialIcon name="close" />
                        </button>
                    </div>
                </div>

                {/* Paper Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-gray-200 dark:bg-black/20 custom-scrollbar print:p-0 print:bg-white print:overflow-visible flex flex-col items-center">
                    <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-[20mm] text-black font-sans leading-normal print:shadow-none print:p-10 print:w-full">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                            <div>
                                <img src="https://i.ibb.co/LD0gPkTn/LOGO-PANELCRAFT-NOVO-PSITIVO.png" alt="PanelCraft" className="h-8 w-auto object-contain mb-2" />
                                <h1 className="text-2xl font-black uppercase tracking-tight">Guia de Referências Visuais</h1>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-[14px] font-bold uppercase text-brand-cyan">{script.title || 'PROJETO SEM TÍTULO'}</span>
                                <span className="text-[10px] font-medium text-gray-500 italic">{script.treatment || 'Tratamento 1'}</span>
                            </div>
                        </div>

                        {panelsWithRefs.length > 0 ? (
                            <div className="space-y-12">
                                {panelsWithRefs.map((panel, pIdx) => (
                                    <div key={panel.id} className="page-break-content">
                                        <div className="bg-flat-dark/10 p-2 mb-4 flex items-center justify-between border-l-4 border-black">
                                            <span className="font-black text-xs uppercase tracking-widest">
                                                Página {panel.pageNumber} — Painel {panel.panelNumber}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-500 italic truncate ml-4 max-w-[400px]">
                                                "{panel.action.substr(0, 100)}..."
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {panel.references?.map((ref) => (
                                                <div key={ref.id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col bg-gray-50">
                                                    {ref.type === 'image' ? (
                                                        <img src={ref.value} alt="Reference" className="w-full h-auto object-contain bg-white" />
                                                    ) : (
                                                        <div className="p-8 flex flex-col items-center justify-center text-center">
                                                            <MaterialIcon name="link" className="text-brand-cyan text-4xl mb-2" />
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Referência Externa</p>
                                                            <p className="text-xs break-all text-blue-600 underline font-medium">{ref.value}</p>
                                                        </div>
                                                    )}
                                                    <div className="p-2 bg-white border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-gray-400">
                                                            {ref.type === 'image' ? 'Imagem Carregada' : 'Link Externo'}
                                                        </span>
                                                        {ref.fileName && <span className="text-[8px] text-gray-400 truncate max-w-[150px]">{ref.fileName}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-200 rounded-3xl opacity-30">
                                <MaterialIcon name="collections_bookmark" className="text-6xl mb-4" />
                                <p className="text-lg font-bold uppercase tracking-widest">Nenhuma referência adicionada</p>
                                <p className="text-sm">Adicione fotos ou links no editor para gerar este guia.</p>
                            </div>
                        )}

                        <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center opacity-30">
                            <span className="text-[9px] font-bold uppercase tracking-widest">© PanelCraft — Guia Técnico do Desenhista</span>
                            <span className="text-[9px] font-bold uppercase tracking-widest">Fim do Documento</span>
                        </div>
                    </div>
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
            background: white !important;
          }
          .page-break-content {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}} />
        </div>
    );
};

export default ReferencePreview;
