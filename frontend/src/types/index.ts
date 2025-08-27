/**
 * Message interface for chat interactions
 */
export interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
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
}
