
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

export interface ScriptData {
  id: string;
  title: string;
  author: string;
  treatment?: string;
  characters: any[];
  pages: PageData[];
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

export type ExportFormat = 'PDF' | 'FOUNTAIN' | 'JSON';
