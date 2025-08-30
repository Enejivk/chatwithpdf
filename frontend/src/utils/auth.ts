import { jwtDecode } from "jwt-decode";

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  sub: string;
  exp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

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

export const storeUserProfile = (user: UserProfile): void => {
  localStorage.setItem("user_profile", JSON.stringify(user));
};

export const getUserProfile = (): UserProfile | null => {
  const storedProfile = localStorage.getItem("user_profile");
  return storedProfile ? JSON.parse(storedProfile) : null;
};

export const clearUserProfile = (): void => {
  localStorage.removeItem("user_profile");
};

export const isAuthenticated = (): boolean => {
  return getUserProfile() !== null;
};
