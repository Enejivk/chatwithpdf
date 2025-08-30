import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { FaUserCircle } from "react-icons/fa";
import { IoMdLogOut } from "react-icons/io";
import AuthModal from "./AuthModal";
import { getUserProfile, clearUserProfile, type UserProfile } from "../../utils/auth";

interface AuthButtonProps {
  isMobile?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ isMobile = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useEffect(() => {
    setUser(getUserProfile());
  }, [isOpen]);

  const handleLogout = () => {
    clearUserProfile();
    setUser(null);
    setShowMenu(false);
  };

  if (user) {
    return (
      <div className="relative">
        {!isMobile && (
          <div className="relative">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              className="hidden md:flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white transition-colors pr-3 pl-2 py-1 h-auto"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-[#DD5953]"
              />
              <span className="max-w-[100px] truncate">{user.name}</span>
            </Button>

            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-3 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <IoMdLogOut className="text-red-500" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {isMobile && (
          <Button
            onClick={() => setShowMenu(!showMenu)}
            className="p-0 w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-700"
          >
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full border border-[#DD5953]"
            />
          </Button>
        )}

        {isMobile && showMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left p-3 text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <IoMdLogOut className="text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!isMobile && (
        <Button
          onClick={() => setIsOpen(true)}
          className="hidden md:flex items-center justify-center gap-2 bg-[#DD5953] hover:bg-[#c74c47] text-white transition-colors"
        >
          <FaUserCircle className="text-lg" />
          <span>Account</span>
        </Button>
      )}

      {isMobile && (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-[#DD5953] hover:bg-[#c74c47] flex items-center justify-center"
        >
          <FaUserCircle className="text-lg" />
        </Button>
      )}

      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
};

export default AuthButton;
