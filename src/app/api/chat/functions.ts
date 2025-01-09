/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from "@vercel/kv";
import { OpenAIApi, Configuration } from "openai-edge";
import { getKV } from "./embedding";

import { config } from "dotenv";
config(); // Load .env variables

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const openai = new OpenAIApi(openaiConfig);

type FunctionNames = "retrieve_from_kv" | "search_knowledge_base";

export const functions: {
  name: FunctionNames;
  description: string;
  parameters: object;
}[] = [
  {
    name: "retrieve_from_kv",
    description: "Retrieve a value from the KV store using a specific key.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "The key to fetch from the KV store.",
        },
      },
      required: ["key"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for relevant documents based on a query.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The query string to search for.",
        },
      },
      required: ["query"],
    },
  },
];
export async function handleFunction(name: string, args: any) {
  if (name === "retrieve_from_kv") {
    const { key } = args;
    if (!key) throw new Error("Key is required for retrieve_from_kv");

    const value = await getKV(key);
    if (!value) throw new Error(`No data found for key: ${key}`);

    return { key, value };
  }

  if (name === "search_knowledge_base") {
    const { query } = args;
    if (!query) throw new Error("Query is required for search_knowledge_base");

    const results = await search_knowledge_base(query);
    return { query, results };
  }

  throw new Error(`Unknown function name: ${name}`);
}

export async function retrieve_from_kv(key: string): Promise<string> {
  const value = await getKV(key);
  if (!value) {
    return `No data found for key: ${key}`;
  }
  return value;
}

async function search_knowledge_base(
  query: string,
  prefix: string = "knowledge:"
): Promise<string[]> {
  const keys = await kv.keys(`${prefix}*`);
  const contents = await Promise.all(keys.map((key) => kv.get<string>(key)));

  const validContents = contents.filter(
    (content): content is string => content !== null
  );

  const matchingDocs = validContents.filter((content) =>
    content.toLowerCase().includes(query.toLowerCase())
  );

  return matchingDocs.slice(0, 3);
}

export { search_knowledge_base };
