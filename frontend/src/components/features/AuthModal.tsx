import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import Logo from "../ui/Logo";
import { parseGoogleCredential, storeUserProfile } from "../../utils/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

/**
 * AuthModal Component
 * Provides a modal for user authentication with Google
 */
const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isMobile = false,
}) => {
  const [loginError, setLoginError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received");
      }

      // Parse and store user information
      const userProfile = parseGoogleCredential(credentialResponse.credential);
      storeUserProfile(userProfile);

      console.log("Login successful:", userProfile);
      setLoginError(null);

      // Close modal after successful sign in
      onClose();
    } catch (error) {
      console.error("Google login error:", error);
      setLoginError("Failed to process login. Please try again.");
    }
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
    setLoginError("Google sign-in failed. Please try again.");
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl transform transition-all
                    ${isMobile ? "w-full max-w-sm" : "w-full max-w-md"}`}
      >
        {/* Modal Header with decorative elements */}
        <div className="relative">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#DD5953]/20 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
          <div className={`${isMobile ? "p-5" : "p-6"} relative`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-[#DD5953] p-2 rounded-lg">
                  <Logo size="sm" withText={false} />
                </div>
                <h3
                  className={`${
                    isMobile ? "text-xl" : "text-2xl"
                  } font-bold text-white tracking-tight`}
                >
                  Sign in
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full"
              >
                <IoClose className="text-xl" />
              </button>
            </div>
            <p className="text-sm text-gray-300 ml-12">
              Access your documents and chat history
            </p>
          </div>
        </div>

        <div className={`${isMobile ? "px-5 pb-5" : "px-6 pb-6"}`}>
          {/* Decorative divider */}
          <div className={`relative ${isMobile ? "my-5" : "my-6"}`}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span
                className={`bg-gray-900 px-4 ${
                  isMobile ? "text-xs" : "text-sm"
                } text-gray-400`}
              >
                Continue with
              </span>
            </div>
          </div>

          {/* Google sign-in button */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_black"
              shape="pill"
              text="signin_with"
              size={isMobile ? "medium" : "large"}
            />
          </div>

          {/* Error message */}
          {loginError && (
            <p className="text-red-500 text-xs text-center mt-4">
              {loginError}
            </p>
          )}

          {/* Additional note */}
          <p
            className={`text-xs text-gray-500 text-center ${
              isMobile ? "mt-5" : "mt-6"
            }`}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
