import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { IoMdSend } from "react-icons/io";
import React, { useEffect, useState, useRef } from "react";
import { BsFillFilePdfFill } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

// Import types and services
import type { Message, UploadDocumentProps, AddTextInputProps } from "./types";
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
}) => {
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! How can I assist you today?",
      sender: "bot",
    },
    {
      id: 2,
      content: "Please upload a PDF document to get started.",
      sender: "bot",
    },
  ]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchResponse = async (message: string) => {
    setIsLoading(true);
    try {
      const data = await chatService.sendMessage(message, fileName);

      const botMessage: Message = {
        id: messages.length + 1,
        content: data.response,
        sender: "bot",
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

const App = () => {
  const [fileName, setFileName] = useState<string>("");
  const [showDocuments, setShowDocuments] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

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

  return (
    <div className="bg-gray-900 min-h-screen h-screen flex flex-col text-gray-100 overflow-hidden">
      <div className="container mx-auto py-3 md:py-6 px-3 md:px-4 flex flex-col flex-1 overflow-hidden">
        {/* Mobile Document Toggle Button */}
        <div className="md:hidden mb-3 flex-shrink-0">
          <Button
            onClick={() => setShowDocuments(!showDocuments)}
            className="w-full flex items-center justify-center gap-2"
          >
            {showDocuments ? (
              <>
                <IoClose className="text-lg" />
                <span>Hide Documents</span>
              </>
            ) : (
              <>
                <HiOutlineMenuAlt2 className="text-lg" />
                <span>Show Documents</span>
              </>
            )}
          </Button>
        </div>

        {/* Responsive Layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 md:gap-6 flex-1 overflow-hidden">
          {/* Documents Panel - Hidden by default on mobile, toggleable, always visible on desktop */}
          <div
            className={`${
              showDocuments || !isMobile ? "flex" : "hidden"
            } md:flex w-full md:w-1/4 bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-4 md:mb-0 flex-shrink-0 md:flex-shrink-0 ${
              showDocuments && isMobile ? "h-[50vh]" : "flex-col"
            }`}
          >
            <UploadDocument
              fileName={fileName}
              setFileName={handleSetFileName}
            />
          </div>

          {/* Chat Panel - Full width on all screens */}
          <div className="w-full md:w-3/4 bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col flex-1">
            <AddTextInput
              fileName={fileName}
              isMobile={isMobile}
              showDocuments={showDocuments}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
