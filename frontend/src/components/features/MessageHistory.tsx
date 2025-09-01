import React, { useState, useEffect, useRef } from "react";
import { FaHistory, FaUser } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import type { TailwindDocs } from "../../types";
import { chatService } from "../../services/api";
import { toast, Toaster } from "sonner";

const MessageHistory: React.FC = () => {
  const [userChats, setUserChats] = useState<TailwindDocs>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const previousPathRef = useRef<string>("");

  // Function to fetch chat history
  const fetchChatHistory = async () => {
    try {
      setIsLoading(true);
      const chatHistory = await chatService.getChatHistory();
      setUserChats(chatHistory);

      if (chatHistory.length > 0) {
        setUserName("User");
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user chat history when component mounts
  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    const pathParts = currentPath.split("/");

    if (pathParts.length > 2 && pathParts[1] === "chat") {
      setSelectedChatId(pathParts[2]);

      // If coming from /chat/new to /chat/{id}, refresh the chat list
      if (previousPathRef.current === "/chat/new" && pathParts[2] !== "new") {
        fetchChatHistory();
      }
    } else {
      setSelectedChatId(null);
    }

    // Update the previous path reference
    previousPathRef.current = currentPath;
  }, [location.pathname]);

  // Format date for display
  const formatDate = (date: Date): string => {
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

  // Format date for Tailwind docs
  const formatTailwindDate = (dateString: string): string => {
    const date = new Date(dateString);
    return formatDate(date);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <Toaster position="top-right" richColors />

      <div className="p-3 md:p-5 flex-1 overflow-hidden flex flex-col">
        {/* User profile section - shows when we have the user's name */}
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl backdrop-blur-sm border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-blue-500/20">
                <FaHistory className="text-blue-400 text-base" />
              </div>
              <h2 className="text-base font-medium text-gray-200">
                Chat History
              </h2>
            </div>
            <button
              onClick={() => navigate("/chat/new")}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
              transition-all duration-200 transform hover:scale-105 
              shadow-lg hover:shadow-blue-500/25 flex items-center gap-1.5 text-sm font-medium"
            >
              <span>New Chat</span>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-400 text-sm">
              Loading history...
            </span>
          </div>
        ) : userChats.length > 0 ? (
          <div className="space-y-2 overflow-y-auto pr-2 flex-1">
            {/* Display Tailwind docs from API */}
            {userChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setSelectedChatId(chat.id);
                  navigate(`/chat/${chat.id}`);
                }}
                className={`cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                  selectedChatId === chat.id
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : "hover:bg-gray-700/50 bg-gray-700/30"
                }`}
              >
                <div className="flex items-center">
                  <h3 className="text-sm font-medium text-gray-200 truncate">
                    {chat.title}
                  </h3>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400">
                    {formatTailwindDate(chat.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FaHistory className="text-gray-500 text-4xl mb-2" />
            <p className="text-gray-400 text-sm">No message history found.</p>
            <p className="text-gray-500 text-xs mt-1">
              Start a new conversation to see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageHistory;
