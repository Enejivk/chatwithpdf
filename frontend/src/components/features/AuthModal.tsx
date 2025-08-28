import React from "react";
import { IoClose } from "react-icons/io5";
import Logo from "../ui/Logo";

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
  if (!isOpen) return null;

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
          <button
            className={`w-full bg-black hover:bg-gray-900 text-white font-medium 
                      border border-gray-800 hover:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 
                      flex items-center justify-center gap-3 group rounded-xl transition-all
                      ${
                        isMobile ? "py-3 px-4 text-sm" : "py-4 px-4 text-base"
                      }`}
            onClick={() => {
              // Google sign in logic would go here
              console.log("Google sign in clicked");
              // Close modal after successful sign in
              onClose();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width={isMobile ? "20px" : "24px"}
              height={isMobile ? "20px" : "24px"}
              className="group-hover:scale-110 transition-transform"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

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
