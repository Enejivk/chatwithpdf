import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ChatResponse, DocumentList, TailwindDocs } from "../types";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token);
    }
  });

  failedQueue = [];
};

const refreshAuthToken = async () => {
  try {
    const response = await apiClient.post(
      "/auth/refresh",
      {},
      {
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
            config: originalRequest,
          });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokenRefreshResponse = await refreshAuthToken();
        isRefreshing = false;

        processQueue(null, tokenRefreshResponse);

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        toast.error(
          "Your session has expired. Please log in again to continue.",
          {
            duration: 5000,
            position: "top-center",
            description:
              "You will need to authenticate to access your documents and chat history.",
          }
        );
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

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
  sendMessage: async (query: string, chatId: string, documentIds: string[]) => {
    try {
      const response = await apiClient.post<{
        id: string;
        content: string;
        sender: "bot";
        timestamp: string;
      }>("/chat", {
        query,
        chat_id: chatId,
        document_ids: documentIds,
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
