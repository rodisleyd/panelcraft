
import { GoogleGenAI, Type } from "@google/genai";
import { ScriptData } from "../types";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

const formatFullScriptContent = (script: ScriptData): string => {
  let content = `CONTEÚDO DO ROTEIRO:\n`;
  script.pages.forEach(page => {
    content += `\nPÁGINA ${page.number}:\n`;
    page.panels.forEach((panel, index) => {
      content += `  PAINEL ${index + 1}:\n`;
      content += `    Ação: ${panel.action}\n`;
      panel.dialogues.forEach(d => {
        content += `    Diálogo (${d.character}): ${d.text}\n`;
      });
      if (panel.captions) content += `    Legenda: ${panel.captions}\n`;
    });
  });
  return content;
};

export const getAIChatResponse = async (messages: ChatMessage[], script: ScriptData) => {
  if (!apiKey) {
    return "A chave da API do Gemini não foi configurada no arquivo .env.";
  }

  const scriptContext = `
    Contexto do Roteiro Atual:
    Título: ${script.title}
    Autor: ${script.author}
    Tratamento/Argumento: ${script.treatment || 'Não definido'}
    Escaleta (Outline): ${script.outline?.map(b => `Pág ${b.page}: ${b.content}`).join('\n') || 'Não definida'}
    Personagens: ${script.characters.map(c => c.name).join(', ')}

    ${formatFullScriptContent(script)}
  `;

  const systemInstruction = `Você é um Assistente Criativo Especialista em Roteiros e Storyboards.
  
  VOCÊ TEM UMA MISSÃO: Atuar como o guardião da visão do autor.
  
  ALICERCE DA HISTÓRIA:
  O "Tratamento/Argumento" e a "Escaleta" fornecidos no contexto são a ALMA deste projeto. 
  1. Sempre consulte o Argumento para entender o tom, o tema e o objetivo de cada cena.
  2. Use a Escaleta para saber em qual ponto da jornada estamos e o que deve acontecer em seguida.
  3. Se o usuário estiver trabalhando em uma página específica, verifique o que a Escaleta previa para aquela página e ajude a expandir essa batida em ações visuais e diálogos consistentes.

  DIRETRIZES DE ATUAÇÃO:
  - Seu objetivo é ajudar o usuário a refinar o roteiro, sugerir diálogos orgânicos, descrever ações visuais impactantes e manter a consistência absoluta dos personagens.
  - Se o usuário mencionar "Página X" ou "Painel Y", consulte o CONTEÚDO DO ROTEIRO abaixo para dar respostas contextualizadas.
  
  REGRAS DE FOCO (CRITICAL):
  1. Se o usuário solicitar o refinamento de um campo específico (ex: "refinar diálogo" ou "refinar ação") de um Painel e Página específicos, FOQUE APENAS nesse campo e nesse painel.
  2. NUNCA sugira alterações para outros painéis ou páginas além do que foi solicitado.
  3. Se o pedido for genérico ou sobre "novo painel", forneça a estrutura completa (🎬 Enquadramento + 📝 Ação + 💬 Diálogo).
  
  ESTRUTURA DE RESPOSTA:
  - Comece com uma breve frase de incentivo ou observação sobre a história.
  - Use "---" para separar cada opção sugerida.
  - Use títulos H3 (###) para o nome de cada opção.
  - SEMPRE use emojis para facilitar a leitura.
  
  CONTEXTO MESTRE DO PROJETO:
  ${scriptContext}`;

  try {
    // Usando a sintaxe original do pacote @google/genai
    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => m.parts).join('\n'),
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Sem resposta da IA.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Desculpe, tive um problema ao processar sua solicitação. Verifique sua chave da API.";
  }
};

export const refineScriptContent = async (text: string, type: 'action' | 'dialogue' | 'captions', characters: string[] = []) => {
  if (!apiKey) return text;

  const charContext = characters.length > 0 ? ` Characters available: ${characters.join(', ')}.` : '';
  const systemInstruction = `You are a professional comic book script consultant. 
  Your goal is to refine ${type} for a comic panel.${charContext}
  Keep it concise, punchy, and visual.
  Format: Return only the refined text.`;

  try {
    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine this ${type}: "${text}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return text;
  }
};

export const suggestNewPanel = async (previousContext: string, characters: string[] = []) => {
  if (!apiKey) return null;

  const charContext = characters.length > 0 ? ` Available characters: ${characters.join(', ')}. Use these characters if appropriate.` : '';
  try {
    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this script context: "${previousContext}", suggest the next panel's action, dialogues, and caption.${charContext}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            dialogues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  character: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["character", "text"]
              }
            },
            captions: { type: Type.STRING },
          },
          required: ["action", "dialogues", "captions"]
        },
        temperature: 0.7
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) return null;
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Gemini Suggest Error:", error);
    return null;
  }
};

export const generateOutlineFromTreatment = async (treatment: string, totalPages: number) => {
  if (!apiKey) throw new Error("API Key missing");

  const systemInstruction = `Você é um editor sênior de quadrinhos. 
  Sua tarefa é ler o argumento (tratamento) fornecido e decupá-lo em uma escaleta de ${totalPages} páginas.
  Seja visual e focado no ritmo narrativo.
  Retorne um JSON estruturado com o campo 'outline' que seja uma array de objetos { page: number, content: string }.`;

  try {
    const response = await (ai as any).models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Gere uma escaleta de ${totalPages} páginas para este argumento: "${treatment}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  page: { type: Type.NUMBER },
                  content: { type: Type.STRING }
                },
                required: ["page", "content"]
              }
            }
          },
          required: ["outline"]
        },
        systemInstruction,
        temperature: 0.7
      }
    });

    const jsonStr = response.text;
    if (!jsonStr) return null;
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Gemini Outline Error:", error);
    throw error;
  }
};
