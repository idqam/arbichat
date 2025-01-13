"use client";
import React, { useState } from "react";
import axios from "axios";
import { Textarea } from "./ui/textarea";

const ChatText = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [thinking, setThinking] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = async () => {
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
  };

  return (
    <>
      <div className="mt-20 relative">
        <Textarea
          className="bg-white pr-16"
          value={query}
          onChange={handleInputChange}
          disabled={thinking}
        />
        <button
          onClick={handleSubmit}
          className={`absolute right-2 bottom-2 p-2 ${
            thinking ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
          } text-white rounded`}
          disabled={thinking}
        >
          {thinking ? "Thinking..." : "Submit"}
        </button>
      </div>

      {thinking && (
        <div className="mt-4 p-4 rounded">
          <p className="text-lg ml-0 font-semibold">Thinking...</p>
        </div>
      )}

      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-xl ml-0 font-semibold">Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </>
  );
};

export default ChatText;
