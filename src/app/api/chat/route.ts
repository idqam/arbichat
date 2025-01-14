import { kv } from "@vercel/kv";
import { Configuration, OpenAIApi } from "openai-edge";
import { functions, handleFunction } from "./functions";
import { SYSTEM_MESSAGE1 } from "@/utils/constants";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userQuery = messages.find((msg: any) => msg.role === "user")?.content;
    if (!userQuery) {
      return new Response("No user query found in the messages", {
        status: 400,
      });
    }

    const cacheKey = `response_${userQuery.toLowerCase()}`;
    const cachedResponse = await kv.get(cacheKey);

    if (cachedResponse) {
      return new Response(JSON.stringify(cachedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
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

      const retrievedChunks = await handleFunction(name, JSON.parse(args));

      const formattedChunks = Array.isArray(retrievedChunks)
        ? retrievedChunks
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

      const finalResponseString = JSON.stringify({
        response: finalMessage.trim(),
      });
      await kv.set(cacheKey, finalResponseString, { ex: 3600 });

      return new Response(finalResponseString, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
