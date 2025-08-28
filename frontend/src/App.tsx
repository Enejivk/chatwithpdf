import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { IoMdSend } from "react-icons/io";
import React, { useEffect, useState, useRef } from "react";
import { BsFillFilePdfFill } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { MdHistory } from "react-icons/md";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import types and services
import type {
  Message,
  UploadDocumentProps,
  AddTextInputProps,
  ChatSession,
  MessageHistoryProps,
} from "./types";
import { documentService, chatService, documentUtils } from "./services/api";
const UploadDocument: React.FC<UploadDocumentProps> = ({
  setFileName,
  fileName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [collectionName, setCollectionName] = useState<string[]>([]);

  const fetchCollectionNames = async () => {
    try {
      const collections = await documentService.getCollections();
      setCollectionName(collections);
    } catch (error) {
      console.error("Error fetching collection names:", error);
    }
  };

  useEffect(() => {
    fetchCollectionNames();
  }, []);

  const uploadFileToBackend = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      await documentService.uploadPdf(file);

      const processedFileName = documentUtils.removePdfExtension(file.name);
      setCollectionName((prevNames) => {
        if (!prevNames.includes(processedFileName)) {
          return [...prevNames, processedFileName];
        }
        return prevNames;
      });

      setFileName(file.name);
      alert("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (file) {
      uploadFileToBackend(file);
    }
  }, [file]);

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="border-b border-gray-700 p-3 md:p-5 flex-shrink-0 text-center md:text-left border-2">
        <h1 className="text-lg md:text-xl font-semibold text-gray-100 mb-1">
          Documents
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          Upload and select PDFs to chat with
        </p>
      </div>

      <div className="p-3 md:p-5 flex-1 overflow-hidden flex flex-col">
        <div className="mb-3 md:mb-4 flex-shrink-0 flex justify-center">
          <input
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
            accept=".pdf"
            className="hidden"
            type="file"
            id="upload-pdf"
          />
          <label
            className="flex items-center justify-center gap-2 
            rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-3 px-3 md:px-4 cursor-pointer 
            transition-all duration-300 ease-in-out shadow-md font-medium w-[80%] md:w-3/4 mx-auto text-sm md:text-base"
            htmlFor="upload-pdf"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaPlus className="text-sm" />
                <span>Upload PDF</span>
              </>
            )}
          </label>
        </div>

        {file && (
          <div className="flex items-center justify-center gap-2 p-2 md:p-3 mb-2 md:mb-3 bg-gray-700/30 rounded-xl flex-shrink-0 w-[80%] mx-auto md:w-full md:mx-0">
            <BsFillFilePdfFill className="text-red-500 text-lg flex-shrink-0" />
            <h2 className="text-xs md:text-sm font-medium text-gray-200 truncate">
              {file.name}
            </h2>
          </div>
        )}

        {collectionName.length > 0 && (
          <div className="mt-3 md:mt-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3 flex-shrink-0 text-center md:text-left">
              Your Documents
            </h3>
            <div className="space-y-2 overflow-y-auto pr-2 flex-1 flex flex-col items-center md:items-start">
              {collectionName.map((name) => (
                <div
                  key={name}
                  onClick={() => setFileName(name)}
                  className={`cursor-pointer flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 w-[80%] md:w-full
                  ${
                    fileName === name
                      ? "bg-gray-700 border-l-4 border-blue-500"
                      : "bg-gray-700/30 hover:bg-gray-700/50"
                  }`}
                >
                  <BsFillFilePdfFill className="text-red-500 text-lg flex-shrink-0" />
                  <span className="text-gray-200 text-sm truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AddTextInput: React.FC<AddTextInputProps> = ({
  fileName,
  isMobile = false,
  showDocuments = false,
  currentSession,
  setMessages: setParentMessages,
  messages: parentMessages,
}) => {
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(
    parentMessages || [
      {
        id: 1,
        content: "Hello! How can I assist you today?",
        sender: "bot",
        timestamp: new Date(),
      },
      {
        id: 2,
        content: "Please upload a PDF document to get started.",
        sender: "bot",
        timestamp: new Date(),
      },
    ]
  );

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (setParentMessages && parentMessages !== messages) {
      setParentMessages(messages);
    }
  }, [messages, setParentMessages, parentMessages]);

  const fetchResponse = async (message: string) => {
    setIsLoading(true);
    try {
      const data = await chatService.sendMessage(message, fileName);

      const botMessage: Message = {
        id: messages.length + 1,
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      // Add error message to the chat
      const errorMessage: Message = {
        id: messages.length + 1,
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    e.preventDefault();

    if (inputMessage.trim() === "") return;

    // Create a new message object
    const newMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    // add the new message to the messages array
    setMessages([...messages, newMessage]);

    // Clear the input field
    setInputMessage("");

    fetchResponse(newMessage.content);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-gray-700 p-3 md:p-5 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-semibold text-gray-100 mb-1">
          Chat with PDF
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          {fileName
            ? `Currently chatting with: ${fileName}`
            : "Select a document to start chatting"}
        </p>
      </div>

      {/* Message container - Flexible height */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4"
        ref={messageContainerRef}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            } message-animation`}
          >
            <div
              className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 text-sm md:text-base rounded-2xl shadow-md ${
                message.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-gray-700 text-gray-100 rounded-tl-none"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start message-animation">
            <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-md">
              <div className="loader mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 md:p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              fileName
                ? "Ask something about your document..."
                : "Upload and select a document to start chatting"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputMessage.trim() !== "") {
                  handleSubmit(e);
                }
              }
            }}
            className="bg-gray-700 border-gray-600 text-gray-100 text-sm md:text-base placeholder:text-gray-400 resize-none rounded-xl min-h-[45px] md:min-h-[60px] max-h-[100px] focus:border-blue-500 transition-all"
          />
          <Button
            disabled={isLoading || inputMessage.trim() === "" || !fileName}
            className="bg-blue-600 hover:bg-blue-700 text-white h-[45px] md:h-[60px] rounded-xl px-3 md:px-6 flex-shrink-0 transition-all duration-300"
          >
            <IoMdSend className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </form>

        {!fileName && (
          <div className="mt-2 text-center text-xs md:text-sm text-gray-400">
            {isMobile && !showDocuments
              ? "Tap 'Show Documents' above to upload or select a PDF"
              : "Please upload and select a PDF document to start a conversation"}
          </div>
        )}
      </div>
    </div>
  );
};

// Add the MessageHistory component before the App component
const MessageHistory: React.FC<MessageHistoryProps> = ({ onSelectSession }) => {
  // Dummy data for message history
  const [chatSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "Understanding Quantum Computing",
      documentName: "quantum_computing.pdf",
      lastMessageDate: new Date(2025, 7, 25, 14, 30),
      messages: [
        {
          id: 1,
          content: "Can you explain quantum entanglement?",
          sender: "user",
          timestamp: new Date(2025, 7, 25, 14, 25),
        },
        {
          id: 2,
          content:
            "Quantum entanglement is a physical phenomenon that occurs when a pair or group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle cannot be described independently of the state of the others. Measurements of physical properties such as position, momentum, spin, and polarization performed on entangled particles can show correlations that would be impossible under the laws of classical physics.",
          sender: "bot",
          timestamp: new Date(2025, 7, 25, 14, 30),
        },
      ],
    },
    {
      id: "2",
      title: "AI Ethics Discussion",
      documentName: "ai_ethics.pdf",
      lastMessageDate: new Date(2025, 7, 24, 10, 15),
      messages: [
        {
          id: 1,
          content: "What are the main ethical concerns with AI development?",
          sender: "user",
          timestamp: new Date(2025, 7, 24, 10, 10),
        },
        {
          id: 2,
          content:
            "The main ethical concerns with AI development include privacy issues, algorithmic bias, job displacement, safety and security risks, transparency and explainability challenges, autonomous weapons development, and the concentration of power in the hands of a few tech companies.",
          sender: "bot",
          timestamp: new Date(2025, 7, 24, 10, 15),
        },
      ],
    },
    {
      id: "3",
      title: "Climate Change Research",
      documentName: "climate_report_2025.pdf",
      lastMessageDate: new Date(2025, 7, 22, 16, 45),
      messages: [
        {
          id: 1,
          content: "What are the projected temperature increases for 2050?",
          sender: "user",
          timestamp: new Date(2025, 7, 22, 16, 40),
        },
        {
          id: 2,
          content:
            "According to the report, global temperatures are projected to increase by 1.5°C to 2.4°C by 2050 under current policy scenarios. However, with more aggressive emissions reductions, we could limit warming to the lower end of that range.",
          sender: "bot",
          timestamp: new Date(2025, 7, 22, 16, 45),
        },
      ],
    },
  ]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        ` at ${date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="border-b border-gray-700 p-3 md:p-5 flex-shrink-0 text-center md:text-left border-2">
        <h1 className="text-lg md:text-xl font-semibold text-gray-100 mb-1">
          Chat History
        </h1>
        <p className="text-xs md:text-sm text-gray-400">
          View and continue your previous conversations
        </p>
      </div>

      <div className="p-3 md:p-5 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="cursor-pointer p-3 rounded-lg bg-gray-700/40 hover:bg-gray-700/60 transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-gray-200 text-sm md:text-base">
                  {session.title}
                </h3>
                <span className="text-xs text-gray-400">
                  {formatDate(session.lastMessageDate)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <BsFillFilePdfFill className="text-red-500" />
                <span>{session.documentName}</span>
              </div>
              <p className="text-xs md:text-sm text-gray-300 truncate">
                {session.messages[
                  session.messages.length - 1
                ].content.substring(0, 100)}
                {session.messages[session.messages.length - 1].content.length >
                100
                  ? "..."
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [fileName, setFileName] = useState<string>("");
  const [showDocuments, setShowDocuments] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
    {
      id: 2,
      content: "Please upload a PDF document to get started.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    // Check if we're on mobile on initial load
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkMobile();

    // Add resize listener to update when window size changes
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSetFileName = (name: string) => {
    setFileName(name);
    // Close the document panel after selection on mobile
    setShowDocuments(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSession(session);
    setFileName(session.documentName);
    setMessages(session.messages);
    setShowHistory(false);
  };

  return (
    <BrowserRouter>
      <div className="bg-gray-900 min-h-screen h-screen flex flex-col text-gray-100 overflow-hidden">
        <div className="container mx-auto py-3 md:py-6 px-3 md:px-4 flex flex-col flex-1 overflow-hidden">
          {/* Mobile Toggle Buttons */}
          <div className="md:hidden mb-3 flex gap-2 flex-shrink-0">
            <Button
              onClick={() => {
                setShowDocuments(!showDocuments);
                if (!showDocuments) setShowHistory(false);
              }}
              className="flex-1 flex items-center justify-center gap-2"
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
              className="flex-1 flex items-center justify-center gap-2"
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
          </div>

          {/* Main Layout */}
          <div className="flex md:gap-6 flex-1 overflow-hidden">
            {/* Sidebar - Contains both Documents and History on desktop */}
            <div className="hidden md:flex flex-col w-1/4 gap-4">
              {/* Documents Panel */}
              <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex-1">
                <UploadDocument
                  fileName={fileName}
                  setFileName={handleSetFileName}
                />
              </div>

              {/* Message History Panel */}
              <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex-1">
                <MessageHistory onSelectSession={handleSelectSession} />
              </div>
            </div>

            {/* Mobile Documents Panel - Conditionally visible */}
            {showDocuments && isMobile && (
              <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <UploadDocument
                  fileName={fileName}
                  setFileName={handleSetFileName}
                />
              </div>
            )}

            {/* Mobile History Panel - Conditionally visible */}
            {showHistory && isMobile && (
              <div className="absolute z-10 inset-x-0 top-16 mx-3 h-[60vh] bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <MessageHistory
                  isMobile={true}
                  showHistory={showHistory}
                  onSelectSession={handleSelectSession}
                />
              </div>
            )}

            {/* Chat Panel - Full width on all screens */}
            <div className="w-full md:w-3/4 bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1">
              <Routes>
                <Route
                  path="/"
                  element={
                    <AddTextInput
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
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
