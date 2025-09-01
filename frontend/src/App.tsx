import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Layout from "./components/features/Layout";
import UploadDocument from "./components/features/UploadDocument";
import MessageHistory from "./components/features/MessageHistory";
import ChatInterface from "./components/features/ChatInterface";

import type { Message } from "./types";

const App: React.FC = () => {
  const [fileName, setFileName] = useState<string>("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showDocuments, setShowDocuments] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 2,
      content: "Please upload a PDF document to get started.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

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

  return (
    <BrowserRouter>
      <Toaster richColors position="top-center" />
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
              <MessageHistory />
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
              <MessageHistory />
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
              <Route path="/history" element={<MessageHistory />} />
            </Routes>
          </div>
        </div>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
