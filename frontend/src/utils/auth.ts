import { jwtDecode } from "jwt-decode";

// Type for decoded Google JWT token
interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google's user ID
  exp: number; // Expiration time
}

// Type for user profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Parse the Google OAuth credential token and extract user information
 * @param credential - JWT token from Google OAuth
 * @returns User profile information
 */
export const parseGoogleCredential = (credential: string): UserProfile => {
  try {
    const decoded = jwtDecode<GoogleUser>(credential);

    return {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    console.error("Error parsing Google credential:", error);
    throw new Error("Failed to parse Google authentication token");
  }
};

/**
 * Store user profile in local storage
 */
export const storeUserProfile = (user: UserProfile): void => {
  localStorage.setItem("user_profile", JSON.stringify(user));
};

/**
 * Get user profile from local storage
 */
export const getUserProfile = (): UserProfile | null => {
  const storedProfile = localStorage.getItem("user_profile");
  return storedProfile ? JSON.parse(storedProfile) : null;
};

/**
 * Remove user profile from local storage (logout)
 */
export const clearUserProfile = (): void => {
  localStorage.removeItem("user_profile");
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getUserProfile() !== null;
};
