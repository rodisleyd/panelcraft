
import { ScriptData, PageData, PanelData } from '../types';

export const scriptToMarkdown = (script: ScriptData): string => {
    let md = `# ${script.title.toUpperCase()}\n`;
    md += `**Autor:** ${script.author || 'Desconhecido'}\n`;
    if (script.trt) md += `**Versão/TRT:** ${script.trt}\n`;
    if (script.treatment) md += `\n### ARGUMENTO DA HISTÓRIA\n${script.treatment}\n`;
    md += `\n---\n\n`;

    script.pages.forEach((page) => {
        md += `## PÁGINA ${page.number}\n\n`;
        page.panels.forEach((panel, idx) => {
            md += `### PAINEL ${idx + 1}\n\n`;
            md += `**AÇÃO:**\n${panel.action || '-'}\n\n`;

            if (panel.dialogues.length > 0) {
                md += `**DIÁLOGOS:**\n`;
                panel.dialogues.forEach(d => {
                    md += `* **${d.character.toUpperCase()}:** ${d.text}\n`;
                });
                md += `\n`;
            }

            if (panel.captions) {
                md += `**LEGENDAS:**\n*${panel.captions}*\n\n`;
            }
            md += `---\n\n`;
        });
    });

    return md;
};

export const scriptToFountain = (script: ScriptData): string => {
    let f = `Title: ${script.title.toUpperCase()}\n`;
    f += `Author: ${script.author || 'Desconhecido'}\n\n`;

    script.pages.forEach((page) => {
        f += `=== PAGE ${page.number} ===\n\n`;
        page.panels.forEach((panel, idx) => {
            f += `.PANEL ${idx + 1}\n\n`;
            f += `${panel.action || ''}\n\n`;

            panel.dialogues.forEach(d => {
                f += `${d.character.toUpperCase()}\n${d.text}\n\n`;
            });

            if (panel.captions) {
                f += `[[CAPTION: ${panel.captions}]]\n\n`;
            }
        });
    });

    return f;
};

export const scriptToProText = (script: ScriptData): string => {
    // A more structured text format for professional reading
    let t = `${script.title.toUpperCase()}\n`;
    t += `Escrito por: ${script.author}\n`;
    if (script.trt) t += `Versão/TRT: ${script.trt}\n`;
    t += `=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".=".\n\n`;

    script.pages.forEach((page) => {
        t += `[ PÁGINA ${page.number} ]\n`;
        t += `--------------------------------------------------------------------------------\n\n`;

        page.panels.forEach((panel, idx) => {
            t += `PAINEL ${idx + 1}\n\n`;

            if (panel.action) {
                t += `    ${panel.action.toUpperCase()}\n\n`;
            }

            panel.dialogues.forEach(d => {
                const charName = d.character.toUpperCase();
                const padding = " ".repeat(Math.max(0, 20 - (charName.length / 2)));
                t += `${padding}${charName}\n`;
                t += `            ${d.text}\n\n`;
            });

            if (panel.captions) {
                t += `    (LEGENDA: ${panel.captions})\n\n`;
            }

            t += `................................................................................\n\n`;
        });
    });

    return t;
};
