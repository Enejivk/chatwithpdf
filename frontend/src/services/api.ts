import axios from "axios";

// API base URL configuration
const API_BASE_URL = "http://localhost:8000";

// Configure axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Service for handling PDF document-related API calls
 */
export const documentService = {
  /**
   * Fetch all document collections
   * @returns {Promise<string[]>} Array of collection names
   */
  getCollections: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>("/get_collections");
      return response.data;
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  },

  /**
   * Upload a PDF document to the server
   * @param {File} file - The PDF file to upload
   * @returns {Promise<any>} Upload response from server
   */
  uploadPdf: async (file: File): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append("pdf_file", file);

      const response = await axios.post(
        `${API_BASE_URL}/upload_pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  },
};

/**
 * Service for handling chat interactions with the PDF
 */
export const chatService = {
  /**
   * Send a message to chat with a PDF document
   * @param {string} query - The user's message/query
   * @param {string} fileName - The PDF file name to query against
   * @returns {Promise<{ response: string }>} Chat response from server
   */
  sendMessage: async (
    query: string,
    fileName: string
  ): Promise<{ response: string }> => {
    try {
      const response = await apiClient.post<{ response: string }>("/chat", {
        query,
        file_name: fileName,
      });

      return response.data;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },
};

/**
 * Utility functions for working with documents
 */
export const documentUtils = {
  /**
   * Remove the .pdf extension from a filename
   * @param {string} filename - The filename to process
   * @returns {string} Filename without .pdf extension
   */
  removePdfExtension: (filename: string): string => {
    return filename.replace(".pdf", "");
  },
};
