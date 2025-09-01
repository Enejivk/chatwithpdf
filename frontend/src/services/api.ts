import axios from "axios";
import type { ChatResponse, DocumentList, TailwindDocs } from "../types";

const API_BASE_URL = "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const documentService = {
  getUserDocuments: async (): Promise<DocumentList> => {
    try {
      const response = await apiClient.get<DocumentList>("/user/documents");
      return response.data;
    } catch (error) {
      console.error("Error fetching user documents:", error);
      throw error;
    }
  },

  getDocuments: async (): Promise<DocumentList> => {
    try {
      const response = await apiClient.get<DocumentList>("/user/documents");
      return response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  getChatDocuments: async (chatId: string): Promise<DocumentList> => {
    try {
      const response = await apiClient.get<DocumentList>(
        `/chat/${chatId}/documents`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching documents for chat ${chatId}:`, error);
      throw error;
    }
  },

  getCollections: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>("/get_collections");
      return response.data;
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  },

  uploadPdf: async (formData: FormData): Promise<any> => {
    try {
      const response = await apiClient.post("/upload_pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  },
};

export const chatService = {
  sendMessage: async (
    query: string,
    fileName: string,
    chatGroupId?: string,
    messageId?: string
  ): Promise<{ response: string; chatGroupId: string }> => {
    try {
      const response = await apiClient.post<{
        response: string;
        chatGroupId: string;
      }>("/chat", {
        query,
        file_name: fileName,
        chat_group_id: chatGroupId,
        message_id: messageId,
      });

      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  getChatGroups: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get<any[]>("/chat_groups");
      return response.data;
    } catch (error) {
      console.error("Error fetching chat groups:", error);
      throw error;
    }
  },

  getChatHistory: async (): Promise<TailwindDocs> => {
    try {
      const response = await apiClient.get<TailwindDocs>("/chats");
      return response.data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw error;
    }
  },

  getChatById: async (chatId: string): Promise<any> => {
    try {
      const response = await apiClient.get<any>(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
      throw error;
    }
  },

  getChatHistoryDetail: async (chatId: string): Promise<ChatResponse> => {
    try {
      const response = await apiClient.get<ChatResponse>(
        `/chathistory/${chatId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat history detail for ${chatId}:`, error);
      throw error;
    }
  },
};

export const documentUtils = {
  removePdfExtension: (filename: string): string => {
    return filename.replace(".pdf", "");
  },
};

export const loginUsingGoogleData = async (data: any) => {
  try {
    await apiClient.post(`/auth/google`, data);
  } catch (error) {
    throw error;
  }
};
