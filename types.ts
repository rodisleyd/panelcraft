
export interface DialogueEntry {
  id: string;
  character: string;
  text: string;
}

export interface Reference {
  id: string;
  type: 'link' | 'image';
  value: string;
  fileName?: string;
}

export interface PanelData {
  id: string;
  action: string;
  dialogues: DialogueEntry[];
  captions: string;
  notes?: string;
  references?: Reference[];
}

export interface PageData {
  id: string;
  number: number;
  panels: PanelData[];
}

export interface Character {
  id: string;
  name: string;
  description?: string;
}

export interface Beat {
  page: number;
  content: string;
}

export interface ScriptData {
  id: string;
  title: string;
  author: string;
  treatment?: string; // Argumento (Story Foundation)
  trt?: string; // Short version tag in header
  characters: any[];
  pages: PageData[];
  outline?: Beat[]; // Escaleta
  roomId?: string;
  lastModified?: number;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  lastActive: number;
  isTyping?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
  image?: string;
  edited?: boolean;
  editedAt?: number;
}

export type ExportFormat = 'PDF' | 'FOUNTAIN' | 'JSON' | 'MARKDOWN';
