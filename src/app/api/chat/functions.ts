/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from "@vercel/kv";

const ALLOWED_TOPICS = [
  "Arbitrum",
  "Ethereum",
  "blockchain",
  "Layer 2",
  "scaling solutions",
];

type FunctionNames = "retrieve_from_kv" | "search_knowledge_base";

export const functions: {
  name: FunctionNames;
  description: string;
  parameters: object;
}[] = [
  {
    name: "retrieve_from_kv",
    description: "Retrieve a specific chunk from the KV store using its key.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description:
            "The key of the chunk to retrieve (e.g., sanitizedFileName_chunk_0).",
        },
      },
      required: ["key"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search for relevant chunks in the knowledge base using a query.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The user's query to search for relevant chunks.",
        },
      },
      required: ["query"],
    },
  },
];

export async function handleFunction(name: string, args: any) {
  if (name === "retrieve_from_kv") {
    return await handleRetrieveFromKV(args);
  }

  if (name === "search_knowledge_base") {
    return await handleSearchKnowledgeBase(args);
  }

  throw new Error(`Unknown function name: ${name}`);
}

async function handleRetrieveFromKV({ key }: { key: string }) {
  if (!key) throw new Error("Key is required for retrieve_from_kv");

  const value = await kv.get<string | null>(key);
  if (!value) throw new Error(`No data found for key: ${key}`);

  return { key, value };
}

export function isQueryRelevant(query: string): boolean {
  return ALLOWED_TOPICS.some((topic) =>
    query.toLowerCase().includes(topic.toLowerCase())
  );
}

async function handleSearchKnowledgeBase({ query }: { query: string }) {
  const keys = await kv.keys("*_chunk_*");
  const contents = await Promise.all(
    keys.map((key) => kv.get<string | null>(key))
  );

  return keys
    .map((key, index) => {
      const content = contents[index];
      if (!content) return null;

      try {
        const parsedContent = JSON.parse(content);
        return {
          key,
          chunk: parsedContent.chunk,
          title: parsedContent.title || "Untitled",
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(({ chunk }: any) =>
      chunk.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 3);
}
