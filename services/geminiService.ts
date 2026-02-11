
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
    Tratamento: ${script.treatment}
    Personagens: ${script.characters.map(c => c.name).join(', ')}

    ${formatFullScriptContent(script)}
  `;

  const systemInstruction = `Você é um assistente criativo especializado em roteiros de quadrinhos e storyboards.
  Seu objetivo é ajudar o usuário a refinar o roteiro, sugerir diálogos, descrever ações visuais impactantes e manter a consistência dos personagens.
  
  Você agora tem acesso ao CONTEÚDO COMPLETO do roteiro abaixo. Quando o usuário mencionar "Página X" ou "Painel Y", consulte esse conteúdo para dar respostas precisas.
  
  REGRAS DE FOCO (CRITICAL):
  1. Se o usuário solicitar o refinamento de um campo específico (ex: "refinar diálogo" ou "refinar ação"), FOQUE APENAS nesse campo e ignore os outros. Não sugira enquadramento ou ação se o pedido for apenas sobre diálogo.
  2. Se o pedido for genérico ou sobre "novo painel", aí sim você deve fornecer a estrutura completa (Enquadramento + Ação + Diálogo).
  
  ESTRUTURA DE RESPOSTA OBRIGATÓRIA:
  1. Comece com uma breve frase de introdução amigável.
  2. Use "---" (réguas horizontais Markdown) para separar CADA opção sugerida.
  3. Use títulos de nível 3 (###) para o nome de cada opção (ex: ### OPÇÃO 1: FOCO DRAMÁTICO).
  4. Use listas com emojis para especificações técnicas SOMENTE quando o foco for múltiplo ou sugestão completa:
     🎬 **Enquadramento**: [Tipo de plano]
     📝 **Ação**: [Descrição visual]
     💬 **Diálogo**: [Se houver]
  5. Use SEMPRE duas quebras de linha entre parágrafos para evitar blocos densos.
  
  CONTEXTO DO PROJETO:
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
