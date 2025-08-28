import React from "react";
import type { ReactNode } from "react";
import Logo from "../ui/Logo";
import AuthButton from "./AuthButton";
import { Button } from "../ui/button";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { MdHistory } from "react-icons/md";

interface LayoutProps {
  children: ReactNode;
  isMobile: boolean;
  showDocuments: boolean;
  showHistory: boolean;
  setShowDocuments: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
}

/**
 * Layout Component
 * Provides the main layout structure for the application
 */
const Layout: React.FC<LayoutProps> = ({
  children,
  isMobile,
  showDocuments,
  showHistory,
  setShowDocuments,
  setShowHistory,
}) => {
  return (
    <div className="bg-black min-h-screen h-screen flex flex-col text-gray-100 overflow-hidden">
      <div className="w-full py-3 md:py-6 px-3 md:px-4 flex flex-col flex-1 overflow-hidden">
        {/* Desktop Header with Account Button */}
        <div className="hidden md:flex justify-between items-center mb-3">
          <Logo size="md" withText={true} />
          <div className="ml-auto">
            <AuthButton />
          </div>
        </div>

        {/* Mobile Toggle Buttons */}
        {isMobile && (
          <div className="md:hidden mb-3 flex gap-2 flex-shrink-0 items-center">
            <div className="mr-1">
              <Logo size="sm" withText={true} />
            </div>

            <Button
              onClick={() => {
                setShowDocuments(!showDocuments);
                if (!showDocuments) setShowHistory(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#DD5953] hover:bg-[#c74c47] text-white"
            >
              {showDocuments ? (
                <>
                  <IoClose className="text-lg" />
                  <span>Hide Documents</span>
                </>
              ) : (
                <>
                  <HiOutlineMenuAlt2 className="text-lg" />
                  <span>Documents</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) setShowDocuments(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#DD5953] hover:bg-[#c74c47] text-white"
            >
              {showHistory ? (
                <>
                  <IoClose className="text-lg" />
                  <span>Hide History</span>
                </>
              ) : (
                <>
                  <MdHistory className="text-lg" />
                  <span>History</span>
                </>
              )}
            </Button>

            {/* Mobile Login Button */}
            <AuthButton isMobile={true} />
          </div>
        )}

        {/* Main Content */}
        {children}
      </div>
    </div>
  );
};

export default Layout;
