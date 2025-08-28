import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import components
import Layout from "./components/features/Layout";
import UploadDocument from "./components/features/UploadDocument";
import MessageHistory from "./components/features/MessageHistory";
import ChatInterface from "./components/features/ChatInterface";

// Import types
import type { Message, ChatSession } from "./types";

/**
 * Main App Component
 * Root component for the PDF Chat application
 */
const App: React.FC = () => {
  const [fileName, setFileName] = useState<string>("");
  const [showDocuments, setShowDocuments] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 2,
      content: "Please upload a PDF document to get started.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  // Check if the viewport is mobile sized on initial load and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * Handle setting the filename and close document panel on mobile
   */
  const handleSetFileName = (name: string) => {
    setFileName(name);
    // Close the document panel after selection on mobile
    if (isMobile) {
      setShowDocuments(false);
    }
  };

  /**
   * Handle selecting a chat session from history
   */
  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setFileName(session.documentName);
    setMessages(session.messages);

    // Close the history panel after selection on mobile
    if (isMobile) {
      setShowHistory(false);
    }
  };

  return (
    <BrowserRouter>
      <Layout
        isMobile={isMobile}
        showDocuments={showDocuments}
        showHistory={showHistory}
        setShowDocuments={setShowDocuments}
        setShowHistory={setShowHistory}
      >
        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden bg-black rounded-2xl">
          {/* Sidebar - Contains both Documents and History on desktop */}
          <div className="hidden md:flex flex-col w-1/4">
            {/* Documents Panel */}
            <div className="overflow-hidden flex-1">
              <UploadDocument
                fileName={fileName}
                setFileName={handleSetFileName}
              />
            </div>

            {/* Message History Panel */}
            <div className="overflow-hidden flex-1">
              <MessageHistory onSelectSession={handleSelectSession} />
            </div>
          </div>

          {/* Mobile Documents Panel - Conditionally visible */}
          {showDocuments && isMobile && (
            <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-black rounded-2xl overflow-hidden">
              <UploadDocument
                fileName={fileName}
                setFileName={handleSetFileName}
              />
            </div>
          )}

          {/* Mobile History Panel - Conditionally visible */}
          {showHistory && isMobile && (
            <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-black rounded-2xl overflow-hidden">
              <MessageHistory onSelectSession={handleSelectSession} />
            </div>
          )}

          {/* Chat Panel - Full width on all screens */}
          <div className="w-full md:w-3/4 flex flex-col flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  <ChatInterface
                    fileName={fileName}
                    isMobile={isMobile}
                    showDocuments={showDocuments}
                    currentSession={currentSession || undefined}
                    messages={messages}
                    setMessages={setMessages}
                  />
                }
              />
              <Route
                path="/history"
                element={
                  <MessageHistory onSelectSession={handleSelectSession} />
                }
              />
            </Routes>
          </div>
        </div>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
