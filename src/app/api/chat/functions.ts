/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from "@vercel/kv";
import { OpenAIApi, Configuration } from "openai-edge";

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openai = new OpenAIApi(openaiConfig);

export async function handleFunction(name: string, args: any): Promise<any> {
  if (name === "retrieve_knowledge") {
    return await retrieveKnowledge(args.query);
  }

  throw new Error(`Unknown function: ${name}`);
}

async function retrieveKnowledge(query: string): Promise<string[]> {
  const keys = await kv.keys("knowledge:*");
  const markdownFiles = await Promise.all(
    keys.map((key) => kv.get<string>(key))
  );

  const validMarkdownFiles = markdownFiles.filter(
    (content): content is string => content !== null
  );

  const relevantDocs = validMarkdownFiles.filter((content) =>
    content.toLowerCase().includes(query.toLowerCase())
  );

  return relevantDocs.slice(0, 3);
}

export { retrieveKnowledge };
