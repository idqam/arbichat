/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from "@vercel/kv";
import { OpenAIApi, Configuration } from "openai-edge";
import { cosineSimilarity } from "../../../utils/cosineSimilarity";

const ALLOWED_TOPICS = [
  "Arbitrum",
  "Ethereum",
  "blockchain",
  "Layer 2",
  "scaling solutions",
  "oracles",
  "stylus",
  "nodes",
  "orbit",
  "Chainlink",
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
  console.log("🔍 Searching knowledge base for query:", query);

  // ✅ Step 1: Retrieve all stored chunk keys
  const keys = await kv.keys("*_chunk_*");
  if (!keys.length) {
    console.log("❌ No knowledge base entries found.");
    return [];
  }

  // ✅ Step 2: Generate embedding for the user query
  const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));
  const queryEmbeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: query,
  });

  if (!queryEmbeddingResponse.ok) {
    throw new Error(`Failed to create embedding for query: ${await queryEmbeddingResponse.text()}`);
  }

  const queryEmbedding = (await queryEmbeddingResponse.json()).data[0]?.embedding;

  // ✅ Step 3: Retrieve stored embeddings from KV
  const contents = await Promise.all(keys.map((key) => kv.get<string | null>(key)));

  // ✅ Step 4: Process & compare embeddings
  const chunkEmbeddings = keys
  .map((key, index) => {
    const content = contents[index];
    if (!content) return null;

    let parsedContent;
    try {
      // ✅ Check if `content` is a string before parsing
      parsedContent = typeof content === "string" ? JSON.parse(content) : content;

      if (!parsedContent || !parsedContent.embedding || !parsedContent.chunk) {
        return null;
      }

      return {
        key,
        chunk: parsedContent.chunk,
        embedding: parsedContent.embedding,
        similarity: cosineSimilarity(queryEmbedding, parsedContent.embedding),
      };
    } catch (error) {
      console.error(`❌ Error parsing key ${key}:`, error, "\nRaw content:", content);
      return null;
    }
  })
  .filter((entry): entry is { key: string; chunk: any; embedding: any; similarity: number } => entry !== null)
  .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0)); // ✅ Ensures sorting doesn't throw null errors

  console.log("🔎 Top matches:", chunkEmbeddings.slice(0, 3));

  // ✅ Step 5: Return most relevant chunks
  return chunkEmbeddings.slice(0, 3).map(({ key, chunk }) => ({ key, chunk }));
}
