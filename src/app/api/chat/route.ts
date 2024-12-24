import { kv } from "@vercel/kv";

import { Ratelimit } from "@upstash/ratelimit";
import { Configuration, OpenAIApi } from "openai-edge";
import { OpenAIStream, StreamingTextResponse } from "ai";
//import { functions, runFunction } from "./functions";

export const runtime = "edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openai = new OpenAIApi(config);

//TODO

export async function POST(req: Request) {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for");
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
  messages.unshift({
    role: "system",
    content:
      "Fetch information based on the user request. If the request is not clear, ask the user for greater specificication. If the user request is clear, fetch the information and display it to the user.",
  });

  const initialResponse = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    
}
