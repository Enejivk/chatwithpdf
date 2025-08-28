import axios from "axios";
import Cookies from "js-cookie";
const API_BASE_URL = "http://localhost:8000";


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


export const documentService = {
  getCollections: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>("/get_collections");
      return response.data;
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw error;
    }
  },


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

export const chatService = {
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


export const documentUtils = {
  removePdfExtension: (filename: string): string => {
    return filename.replace(".pdf", "");
  },
};


export const loginUsingGoogleData = async (data: any) => {
  try {
    const response = await axios.post("auth/login_google", data);
    Cookies.set("token", response.data);
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
}