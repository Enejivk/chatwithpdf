import React, { useEffect, useState, useRef } from "react";
import { IoMdSend } from "react-icons/io";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { chatService } from "../../services/api";
import type { Message, AddTextInputProps } from "../../types";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const ChatInterface: React.FC<AddTextInputProps> = ({
  fileName,
  selectedFileIds,
  setMessages: setParentMessages,
  messages: parentMessages,
}) => {
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { chatId } = useParams<{ chatId: string }>();

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

  useEffect(() => {
    const loadChat = async () => {
      if (chatId && chatId !== "new") {
        try {
          setIsLoading(true);
          const chatData = await chatService.getChatById(chatId);
          setMessages(chatData.messages || []);
        } catch (error) {
          console.error("Error loading chat:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (chatId === "new") {
        // Clear messages for a new chat
        setMessages([
          {
            id: 1,
            content: "Please upload a PDF document to get started.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      }
    };

    loadChat();
  }, [chatId]);

  const fetchResponse = async (message: string) => {
    if (!fileName) return;

    setIsLoading(true);
    try {
      const data = await chatService.sendMessage(
        message,
        chatId || "new",
        selectedFileIds || []
      );

      const botMessage: Message = {
        id: messages.length + 2,
        content: data.content,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
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
    };
    setMessages([...messages, newMessage]);
    setInputMessage("");
    fetchResponse(newMessage.content);
  };

  return (
    <div className="flex flex-col h-full rounded-lg">
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
                  ? "bg-blue-500/10 border border-blue-500/30"
                  : "bg-[#f2f2f210] text-gray-100 rounded-tl-none"
              }`}
            >
              {message.sender === "user" ? (
                message.content
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
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
                ? "Ask a question about your document..."
                : "Please upload a document first"
            }
            disabled={!fileName || isLoading}
            className="min-h-[45px] max-h-[180px] text-sm md:text-base resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (inputMessage.trim() !== "" && fileName && !isLoading) {
                  handleSubmit(e);
                }
              }
            }}
          />
          <Button
            type="submit"
            className="h-10 w-10 shrink-0 rounded-full bg-[#DD5953] hover:bg-[#c74c47] transition-colors"
            aria-label="Send message"
            disabled={!fileName || isLoading || inputMessage.trim() === ""}
          >
            <IoMdSend className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
