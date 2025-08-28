import React, { useState } from "react";
import { BsFillFilePdfFill } from "react-icons/bs";
import type { MessageHistoryProps, ChatSession } from "../../types";

/**
 * MessageHistory Component
 * Displays a list of previous chat sessions and allows the user to select one
 */
const MessageHistory: React.FC<MessageHistoryProps> = ({ onSelectSession }) => {
  // Sample data for message history - would be fetched from backend in production
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

  /**
   * Format a date for display in the chat history
   * @param date - The date to format
   * @returns Formatted date string
   */
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

      <div className="p-3 md:p-5 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="cursor-pointer rounded-lg hover:bg-gray-700/60 transition-all duration-300 group"
            >
              <div className="p-2 flex justify-between items-center">
                <h3 className="font-medium text-gray-400 md:text-base truncate text-sm">
                  {session.title}
                </h3>
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 flex-shrink-0">
                  {formatDate(session.lastMessageDate)}
                </span>
              </div>

              {/* Content that appears on hover */}
              <div className="max-h-0 overflow-hidden group-hover:max-h-24 transition-all duration-300 ease-in-out px-2 pb-0 group-hover:pb-2">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <BsFillFilePdfFill className="text-red-500" />
                  <span>{session.documentName}</span>
                </div>
                <p className="text-xs md:text-sm text-gray-300 truncate">
                  {session.messages[
                    session.messages.length - 1
                  ].content.substring(0, 100)}
                  {session.messages[session.messages.length - 1].content
                    .length > 100
                    ? "..."
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MessageHistory;
