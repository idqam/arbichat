"use client";
import React, { useState, useCallback } from "react";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

const ChatText = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [thinking, setThinking] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!query.trim()) return;
    setThinking(true);
    setResponse("");
    try {
      const result = await axios.post("/api/chat", {
        messages: [{ role: "user", content: query }],
      });
      setResponse(result.data.response);
    } catch (error) {
      console.error("Error making POST request", error);
      setResponse("An error occurred. Please try again.");
    } finally {
      setThinking(false);
    }
  }, [query]);

  const quickActions = [
    "What is Arbitrum?",
    "How do I get started building on Arbitrum?",
    "What is Arbitrum Orbit?",
    "What is Arbitrum Nova?",
  ];

  const handleQuickAction = (action: string) => {
    setQuery(action);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action)}
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-200 hover:shadow-md transition"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="flex items-center w-full gap-4">
        <textarea
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          placeholder="Type your question here..."
          value={query}
          onChange={handleInputChange}
          disabled={thinking}
        />
        <div
          onClick={handleSubmit}
          className={`flex items-center justify-center p-3 text-white bg-blue-500 hover:bg-blue-600 rounded-full cursor-pointer ${
            thinking ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
        >
          <FiSend className="w-5 h-5" />
        </div>
      </div>

      {thinking && (
        <div className="flex items-center justify-center text-gray-600 gap-2">
          <AiOutlineLoading3Quarters className="animate-spin w-5 h-5" />
          <span>Loading...</span>
        </div>
      )}

      {response && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Response:
          </h2>
          <p className="text-sm text-gray-700">{response}</p>
        </div>
      )}
    </div>
  );
};

export default ChatText;
