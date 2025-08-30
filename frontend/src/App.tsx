import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/features/Layout";
import UploadDocument from "./components/features/UploadDocument";
import MessageHistory from "./components/features/MessageHistory";
import ChatInterface from "./components/features/ChatInterface";

import type { Message, ChatSession } from "./types";

const App: React.FC = () => {
  const [fileName, setFileName] = useState<string>("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
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

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSetSelectedFileIds = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);

    if (fileIds.length === 1) {
      setFileName(fileIds[0]);
    } else if (fileIds.length === 0) {
      setFileName("");
    }

    if (isMobile) {
      setShowDocuments(false);
    }
  };


  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setFileName(session.documentName);
    setMessages(session.messages);

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
        <div className="flex flex-1 overflow-hidden bg-black rounded-2xl">
          <div className="hidden md:flex flex-col w-1/4">
            <div className="overflow-hidden flex-1">
              <UploadDocument
                selectedFileIds={selectedFileIds}
                setSelectedFileIds={handleSetSelectedFileIds}
              />
            </div>

            <div className="overflow-hidden flex-1">
              <MessageHistory onSelectSession={handleSelectSession} />
            </div>
          </div>

          {showDocuments && isMobile && (
            <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-black rounded-2xl overflow-hidden">
              <UploadDocument
                selectedFileIds={selectedFileIds}
                setSelectedFileIds={handleSetSelectedFileIds}
              />
            </div>
          )}

          {showHistory && isMobile && (
            <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-black rounded-2xl overflow-hidden">
              <MessageHistory onSelectSession={handleSelectSession} />
            </div>
          )}

          <div className="w-full md:w-3/4 flex flex-col flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  <ChatInterface
                    fileName={fileName}
                    selectedFileIds={selectedFileIds}
                    isMobile={isMobile}
                    showDocuments={showDocuments}
                    currentSession={currentSession || undefined}
                    messages={messages}
                    setMessages={setMessages}
                  />
                }
              />
              <Route
                path="/chat/:chatId"
                element={
                  <ChatInterface
                    fileName={fileName}
                    selectedFileIds={selectedFileIds}
                    isMobile={isMobile}
                    showDocuments={showDocuments}
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
