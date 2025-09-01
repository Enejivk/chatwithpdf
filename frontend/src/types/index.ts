export interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp?: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  documentName: string;
  lastMessageDate: Date;
  messages: Message[];
}

export type DocumentItem = {
  id: string;
  filename: string;
  title: string;
  created_at: string;
};

export type DocumentList = DocumentItem[];

export interface UploadDocumentProps {
  setSelectedFileIds: (fileIds: string[]) => void;
  selectedFileIds: string[];
}

export interface AddTextInputProps {
  fileName?: string;
  selectedFileIds?: string[];
  isMobile?: boolean;
  showDocuments?: boolean;
  currentSession?: ChatSession;
  setMessages?: (messages: Message[]) => void;
  messages?: Message[];
}

/**
 * Tailwind document type for chat history
 */
export type TailwindDoc = {
  id: string; // unique identifier
  title: string; // title of the document
  created_at: string; // ISO timestamp
};

/**
 * List of Tailwind documents
 */
export type TailwindDocs = TailwindDoc[];

/**
 * API response types for chat detail
 */
export type ApiMessage = {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  created_at: string; // ISO timestamp
  document_ids: string[];
};

export type ApiDocument = {
  id: string;
  filename: string;
  title: string;
  created_at: string; // ISO timestamp
};

export type ApiChat = {
  id: string;
  title: string;
  created_at: string;
};

export type ChatResponse = {
  chat: ApiChat;
  messages: ApiMessage[];
  documents: ApiDocument[];
};
