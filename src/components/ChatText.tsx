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
    <div className="chat-text-container">
      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleQuickAction(action)}
            className="quick-action-button"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="input-section">
        <textarea
          className="input-textarea"
          placeholder="Type your question here..."
          value={query}
          onChange={handleInputChange}
          disabled={thinking}
        />
        <div
          onClick={handleSubmit}
          className={`submit-button ${thinking ? "disabled" : ""}`}
        >
          <FiSend />
        </div>
      </div>

      {thinking && (
        <div className="loading">
          <AiOutlineLoading3Quarters className="spinner" />
          <span>Loading...</span>
        </div>
      )}

      {response && (
        <div className="response-container">
          <h2 className="response-title">Response:</h2>
          <p className="response-text">{response}</p>
        </div>
      )}
    </div>
  );
};

export default ChatText;
