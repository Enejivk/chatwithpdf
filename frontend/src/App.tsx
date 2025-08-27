import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IoMdSend } from "react-icons/io";
import React, { useEffect, useState, useRef } from "react";
import { BsFillFilePdfFill } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import axios from "axios";

interface Message {
  id: number;
  content: string;
  sender: "user" | "bot";
}

interface UploadDocumentProps {
  setFileName: (file: string) => void;
  fileName: string;
}
const UploadDocument: React.FC<UploadDocumentProps> = ({ setFileName, fileName }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [collectionName, setCollectionName] = useState<string[]>([]);

  const removePdfFromFileName = (filename: string) => {
    return filename.replace('.pdf', '');
  }

  const fetchCollectionNames = async () => {
    try {
      const response = await axios.get('http://localhost:8000/get_collections');
      if (response.status === 200) {
        setCollectionName(response.data);
      }
    } catch (error) {
      console.error('Error fetching collection names:', error);
    }
  }

  useEffect(() => {
    fetchCollectionNames()
  }, [])

  const uploadFileToBackend = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('pdf_file', file);

      const response = await axios.post('http://localhost:8000/upload_pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        fileName = removePdfFromFileName(file.name);
        setCollectionName((prevNames) => {
          if (!prevNames.includes(fileName)) {
            return [...prevNames, fileName];
          }
          return prevNames;
        });

        setFileName(file.name);
        alert('File uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
    }finally{
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (file) {
      uploadFileToBackend(file);
    }
  }, [file]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700 p-5">
        <h1 className="text-xl font-semibold text-gray-100 mb-1">Documents</h1>
        <p className="text-gray-400 text-sm">Upload and select PDFs to chat with</p>
      </div>
      
      <div className="p-5">
        <div className="mb-6">
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
            rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 cursor-pointer 
            transition-all duration-300 ease-in-out shadow-md font-medium w-full"
            htmlFor="upload-pdf">
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
          <div className="flex items-center gap-2 p-3 mb-4 bg-gray-700/30 rounded-xl">
            <BsFillFilePdfFill className="text-red-500 text-xl flex-shrink-0" />
            <h2 className="text-sm font-medium text-gray-200 truncate">
              {file.name}
            </h2>
          </div>
        )}
        
        {collectionName.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Your Documents</h3>
            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {collectionName.map((name) => (
                <div 
                  key={name}
                  onClick={() => setFileName(name)}
                  className={`cursor-pointer flex items-center gap-2 p-3 rounded-xl transition-all duration-200 
                  ${fileName === name 
                    ? "bg-gray-700 border-l-4 border-blue-500" 
                    : "bg-gray-700/30 hover:bg-gray-700/50"}`}
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
  )
}
}

interface AddTextInputProps {
  fileName: string;
}

const AddTextInput: React.FC<AddTextInputProps> = ({ fileName }) => {
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        id: 1,
        content: "Hello! How can I assist you today?",
        sender: "bot"
      },
      {
        id: 2,
        content: "Please upload a PDF document to get started.",
        sender: "bot"
      }
    ]
  )

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchResponse = async (message: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/chat', {
        query: message,
        file_name: fileName
      });

      if (response.status === 200) {
        const botMessage: Message = {
          id: messages.length + 1,
          content: response.data.response,
          sender: "bot"
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      // Add error message to the chat
      const errorMessage: Message = {
        id: messages.length + 1,
        content: "Sorry, I encountered an error processing your request. Please try again.",
        sender: "bot"
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    if (inputMessage.trim() === "") return;

    // Create a new message object
    const newMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: "user"
    };

    // add the new message to the messages array
    setMessages([...messages, newMessage]);

    // Clear the input field
    setInputMessage("");

    fetchResponse(newMessage.content);
  }

  return (
    <div className="flex flex-col h-[97vh] relative">
      {/* Chat header */}
      <div className="border-b border-gray-700 p-5">
        <h1 className="text-xl font-semibold text-gray-100 mb-1">Chat with PDF</h1>
        <p className="text-gray-400 text-sm">
          {fileName 
            ? `Currently chatting with: ${fileName}` 
            : "Select a document to start chatting"}
        </p>
      </div>

      {/* Message container */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-4" 
        ref={messageContainerRef}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} message-animation`}
          >
            <div 
              className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
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
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form
          className="flex items-end gap-2"
          onSubmit={handleSubmit}
        >
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={fileName ? "Ask something about your document..." : "Upload and select a document to start chatting"}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputMessage.trim() !== "") {
                  handleSubmit(e);
                }
              }
            }}
            className="bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400 resize-none rounded-xl min-h-[60px] focus:border-blue-500 transition-all"
          />
          <Button
            disabled={isLoading || inputMessage.trim() === "" || !fileName}
            className="bg-blue-600 hover:bg-blue-700 text-white h-[60px] rounded-xl px-6 transition-all duration-300"
          >
            <IoMdSend className="h-5 w-5" />
          </Button>
        </form>

        {!fileName && (
          <div className="mt-2 text-center text-gray-400 text-sm">
            Please upload and select a PDF document to start a conversation
          </div>
        )}
      </div>
    </div>
  )
}
}



const App = () => {
  const [fileName, setFileName] = useState<string>("");
  const handleSetFileName = (name: string) => {
    setFileName(name);
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100">
      <div className="container mx-auto py-6">
        <div className="flex justify-between gap-6">
          <div className="w-1/4 bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <UploadDocument
              fileName={fileName}
              setFileName={handleSetFileName}
            />
          </div>
          <div className="w-3/4 bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <AddTextInput
              fileName={fileName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App