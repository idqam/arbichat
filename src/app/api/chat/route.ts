import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { Configuration, OpenAIApi } from "openai-edge";
import { functions, handleFunction } from "./functions";

export const runtime = "edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

const SYSTEM_MESSAGE = {
  role: "system",
  content:
    "Fetch information based on the user request. If the request is unclear, ask the user for clarification. If the request is clear, fetch the information and display it to the user.",
};

export async function POST(req: Request) {
  try {
    // Apply rate limiting
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.KV_REST_API_URL &&
      process.env.KV_REST_API_TOKEN
    ) {
      const ip =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("host") ||
        "unknown_ip";
      const ratelimit = new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(50, "1 d"), // Limit to 50 requests per day
      });

      const { success, limit, reset, remaining } = await ratelimit.limit(
        `chat_ratelimit_${ip}`
      );

      if (!success) {
        return new Response("You've maxed out your daily requests.", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        });
      }
    }

    const rawBody = await req.text();
    if (!rawBody) {
      return new Response("Request body is empty", { status: 400 });
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return new Response("Invalid JSON payload", { status: 400 });
    }

    const { messages } = parsedBody;
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid request payload:", parsedBody);
      return new Response(
        "Invalid request payload. `messages` must be an array.",
        { status: 400 }
      );
    }

    messages.unshift(SYSTEM_MESSAGE);

    const initialResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini-2024-07-18",
      messages,
      function_call: "auto",
      functions,
    });

    if (!initialResponse.ok) {
      const errorDetails = await initialResponse.text();
      console.error("Error from OpenAI API (initial request):", errorDetails);
      return new Response("Error communicating with OpenAI API", {
        status: 500,
      });
    }

    const initialResponseJson = await initialResponse.json();
    const initialMessage = initialResponseJson?.choices?.[0]?.message;

    if (initialMessage?.function_call) {
      const { name, arguments: args } = initialMessage.function_call;

      let retrievedChunks;
      try {
        retrievedChunks = await handleFunction(name, JSON.parse(args));
      } catch (error) {
        console.error("Error in handleFunction:", error);
        return new Response("Error handling function call", { status: 500 });
      }

      const finalResponse = await openai.createChatCompletion({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          ...messages,
          initialMessage,
          { role: "function", name, content: JSON.stringify(retrievedChunks) },
        ],
      });

      if (!finalResponse.ok) {
        const errorDetails = await finalResponse.text();
        console.error("Error from OpenAI API (final request):", errorDetails);
        return new Response("Error communicating with OpenAI API", {
          status: 500,
        });
      }

      const finalResponseData = await finalResponse.json();
      const finalMessage = finalResponseData.choices?.[0]?.message?.content;

      return new Response(JSON.stringify({ response: finalMessage.trim() }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      "No function call detected in initial OpenAI response.",
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/chat:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

//model: "gpt-4o-mini-2024-07-18",
