/**
 * Message interface for chat interactions
 */
export interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp?: Date;
}

/**
 * Chat session for message history
 */
export interface ChatSession {
  id: string;
  title: string;
  documentName: string;
  lastMessageDate: Date;
  messages: Message[];
}

/**
 * Props for the MessageHistory component
 */
export interface MessageHistoryProps {
  isMobile?: boolean;
  showHistory?: boolean;
  onSelectSession: (session: ChatSession) => void;
}

/**
 * Props for the UploadDocument component
 */
export interface UploadDocumentProps {
  setFileName: (file: string) => void;
  fileName: string;
}

/**
 * Props for the AddTextInput component
 */
export interface AddTextInputProps {
  fileName: string;
  isMobile?: boolean;
  showDocuments?: boolean;
  currentSession?: ChatSession;
  setMessages?: (messages: Message[]) => void;
  messages?: Message[];
}
