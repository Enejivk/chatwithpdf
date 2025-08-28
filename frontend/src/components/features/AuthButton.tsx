import React, { useState } from "react";
import { Button } from "../ui/button";
import { FaUserCircle } from "react-icons/fa";
import AuthModal from "./AuthModal";

interface AuthButtonProps {
  isMobile?: boolean;
}

/**
 * AuthButton Component
 * Button for opening the authentication modal
 */
const AuthButton: React.FC<AuthButtonProps> = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="relative">
      {/* Desktop Button */}
      {!isMobile && (
        <Button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center justify-center gap-2 bg-[#DD5953] hover:bg-[#c74c47] text-white transition-colors"
        >
          <FaUserCircle className="text-lg" />
          <span>Account</span>
        </Button>
      )}

      {/* Mobile Button */}
      {isMobile && (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#DD5953] hover:bg-[#c74c47] flex items-center justify-center"
        >
          <FaUserCircle className="text-lg" />
        </Button>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
};

export default AuthButton;
