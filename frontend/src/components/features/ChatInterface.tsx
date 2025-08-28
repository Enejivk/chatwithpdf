import React, { useEffect, useState, useRef } from "react";
import { IoMdSend } from "react-icons/io";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { chatService } from "../../services/api";
import type { Message, AddTextInputProps } from "../../types";

/**
 * ChatInterface Component
 * Provides the main chat UI for interacting with PDF documents
 */
const ChatInterface: React.FC<AddTextInputProps> = ({
  fileName,
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
        content: "Please upload a PDF document to get started.",
        sender: "bot",
        timestamp: new Date(),
      },
    ]
  );

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync messages with parent component if provided
  useEffect(() => {
    if (setParentMessages && parentMessages !== messages) {
      setParentMessages(messages);
    }
  }, [messages, setParentMessages, parentMessages]);

  /**
   * Fetch response from backend API
   * @param message - User's message to send to the backend
   */
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

  /**
   * Handle form submission for sending a message
   */
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

    // Add the new message to the messages array
    setMessages([...messages, newMessage]);

    // Clear the input field
    setInputMessage("");

    fetchResponse(newMessage.content);
  };

  return (
    <div className="flex flex-col h-full rounded-lg">
    

      {/* Message container - Flexible height */}
      <div
        className="flex-1 overflow-y-auto md:px-25 space-y-3 md:space-y-4 px-3"
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
              className={`p-3 max-w-[85%] md:max-w-[80%] md:p-2 text-sm md:text-base rounded-2xl shadow-md ${
                message.sender === "user"
                  ? "bg-[#DD5953] text-white rounded-tr-none"
                  : "bg-[#f2f2f310] text-gray-100 rounded-tl-none"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start message-animation">
            <div className="text-gray-100 rounded-2xl rounded-tl-none p-4 max-w-[80%] shadow-md">
              <div className="loader mx-auto"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 md:p-4 bg-black flex-shrink-0 md:px-25">
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
            className="bg-gray-900 border-gray-800 text-gray-100 text-sm md:text-base placeholder:text-gray-400 resize-none rounded-xl min-h-[45px] md:min-h-[60px] max-h-[100px] focus:border-[#DD5953] transition-all"
          />
          <Button
            disabled={isLoading || inputMessage.trim() === "" || !fileName}
            className="bg-[#DD5953] hover:bg-[#c74c47] text-white h-[45px] md:h-[60px] rounded-xl px-3 md:px-6 flex-shrink-0 transition-all duration-300"
          >
            <IoMdSend className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
