import { apiClient } from "./api";
import { getUserProfile, clearUserProfile } from "../utils/auth";

export const authService = {
  logout: async () => {
    try {
      await apiClient.post(
        "/auth/logout",
        {},
        {
          withCredentials: true,
        }
      );
      clearUserProfile();
    } catch (error) {
      console.error("Error during logout:", error);
      clearUserProfile();
      throw error;
    }
  },

  getCurrentUser: () => {
    return getUserProfile();
  },

  isAuthenticated: () => {
    return getUserProfile() !== null;
  },
};
