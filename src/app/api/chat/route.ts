import { kv } from "@vercel/kv";

import { Ratelimit } from "@upstash/ratelimit";
import { Configuration, OpenAIApi } from "openai-edge";

import { handleFunction } from "./functions";
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
//TODO

export async function POST(req: Request) {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"), //this can be changed, we are doing 50 request for day
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `chathn_ratelimit_${ip}`
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
  const { messages } = await req.json();
  if (!messages || !Array.isArray(messages)) {
    return new Response("Invalid request payload", { status: 400 });
  }
  messages.unshift(SYSTEM_MESSAGE);

  const initialResponse = await openai.createChatCompletion({
    model: "gpt-4",
    messages,
    function_call: "auto",
  });
  const initialMessage = (await initialResponse.json()).choices[0]?.message;

  if (initialMessage?.function_call) {
    const { name, arguments: args } = initialMessage.function_call;

    // Handle the function call in the `functions` file
    const retrievedChunks = await handleFunction(name, JSON.parse(args));

    const finalResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        ...messages,
        initialMessage,
        {
          role: "function",
          name,
          content: JSON.stringify(retrievedChunks),
        },
      ],
    });

    const finalMessage = (await finalResponse.json()).choices[0]?.message
      ?.content;

    return new Response(JSON.stringify({ response: finalMessage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("No function call detected", { status: 400 });
}
