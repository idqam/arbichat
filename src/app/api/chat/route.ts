/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from "@vercel/kv";
import { Configuration, OpenAIApi } from "openai-edge";
import { functions, handleFunction } from "./functions";
import { SYSTEM_MESSAGE1 } from "@/utils/constants";
import { Ratelimit } from "@upstash/ratelimit";
export const runtime = "edge";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const config = new Configuration({
  apiKey: OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

const SYSTEM_MESSAGE = {
  role: "system",
  content: SYSTEM_MESSAGE1,
};
export async function POST(req: Request) {
  try {
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

    const { messages } = JSON.parse(rawBody);
    if (!Array.isArray(messages)) {
      return new Response(
        "Invalid request payload. `messages` must be an array.",
        { status: 400 }
      );
    }

    const userQuery = messages.find((msg: any) => msg.role === "user")?.content;
    if (!userQuery) {
      return new Response("No user query found in the messages", {
        status: 400,
      });
    }

    messages.unshift(SYSTEM_MESSAGE);

    const initialResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini-2024-07-18",
      messages,
      function_call: "auto",
      functions,
    });

    const initialResponseJson = await initialResponse.json();
    const initialMessage = initialResponseJson?.choices?.[0]?.message;

    if (initialMessage?.function_call) {
      const { name, arguments: args } = initialMessage.function_call;

      const retrievedChunks = (await handleFunction(
        name,
        JSON.parse(args)
      )) as { title: string; chunk: string }[];

      const formattedChunks = Array.isArray(retrievedChunks)
        ? retrievedChunks
            .filter(
              (chunk): chunk is { title: string; chunk: string } =>
                chunk !== null
            )
            .map(
              ({ title, chunk }: { title: string; chunk: string }) =>
                `Title: ${title}\nContent: ${chunk}`
            )
            .join("\n\n")
        : "";

      const finalResponse = await openai.createChatCompletion({
        model: "gpt-4o-mini-2024-07-18",
        messages: [
          ...messages,
          initialMessage,
          {
            role: "function",
            name,
            content: JSON.stringify(retrievedChunks),
          },
          {
            role: "assistant",
            content: `Here is the information retrieved from the knowledge base:\n\n${formattedChunks}`,
          },
        ],
      });

      const finalResponseData = await finalResponse.json();
      const finalMessage = finalResponseData.choices?.[0]?.message?.content;

      return new Response(
        JSON.stringify({
          response: finalMessage.trim(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      "No function call detected in initial OpenAI response.",
      { status: 400 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
