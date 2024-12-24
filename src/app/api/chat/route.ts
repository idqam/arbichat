//import { kv } from "@vercel/kv";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Ratelimit } from "@upstash/ratelimit";
import { Configuration, OpenAIApi } from "openai-edge";
//import { OpenAIStream, StreamingTextResponse } from "ai";
//import { functions, runFunction } from "./functions";

export const runtime = "edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openai = new OpenAIApi(config);


//TODO
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
  if (
    process.env.NODE_ENV !== 'development' && 
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  )
  const ip = res.headers.get("x-forwarded-for");
  const ratelimit = new Ratelimit({
    redis: kv, 
    limiter: Ratelimit.slidingWindow(50, "1 d")
  })


}
