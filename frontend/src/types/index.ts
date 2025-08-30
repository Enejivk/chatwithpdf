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

export interface MessageHistoryProps {
  isMobile?: boolean;
  showHistory?: boolean;
  onSelectSession: (session: ChatSession) => void;
}

export type DocumentItem = {
  id: string;
  filename: string;
  document_id: string;
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
