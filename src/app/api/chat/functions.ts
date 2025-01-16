import { kv } from "@vercel/kv";
import { OpenAIApi, Configuration } from "openai-edge";


const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

export type FunctionNames = "retrieve_from_kv" | "search_knowledge_base";

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
        top_k: {
          type: "number",
          description: "Number of top results to return.",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Main handler for registered functions.
 * @param name Function name
 * @param args Function arguments
 */
export async function handleFunction(name: string, args: any) {
  switch (name) {
    case "retrieve_from_kv":
      return await handleRetrieveFromKV(args);
    case "search_knowledge_base":
      return await handleSearchKnowledgeBase(args);
    default:
      throw new Error(`Unknown function name: ${name}`);
  }
}

/**
 * Handles retrieval of a value from the KV store by key.
 * @param args Function arguments
 */
async function handleRetrieveFromKV(args: { key: string }) {
  const { key } = args;
  if (!key) throw new Error("Key is required for retrieve_from_kv");

  const value = await kv.get<string>(key);
  if (!value) throw new Error(`No data found for key: ${key}`);

  return { key, value };
}

<<<<<<< Updated upstream
async function search_knowledge_base(
  query: string,
  prefix: string = "knowledge:"
): Promise<string[]> {
  const keys = await kv.keys(`${prefix}*`);
  const contents = await Promise.all(keys.map((key) => kv.get<string>(key)));
=======
/**
 * Handles search in the knowledge base using cosine similarity.
 * @param args Function arguments
 */
async function handleSearchKnowledgeBase(args: { query: string; top_k?: number }) {
  const { query, top_k = 3 } = args;
  if (!query) throw new Error("Query is required for search_knowledge_base");
>>>>>>> Stashed changes

  // Retrieve all embeddings and content
  const keys = await kv.keys("knowledge:*");
  const documents = await Promise.all(
    keys.map(async (key) => {
      const data = await kv.get<string>(key);
      return data ? JSON.parse(data) : null;
    })
  );

  // Filter valid documents
  const validDocs = documents.filter(
    (doc): doc is { content: string; embedding: number[] } => doc !== null && doc.embedding
  );

<<<<<<< Updated upstream
  return matchingDocs.slice(0, 3);
=======
  // Fetch query embedding
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: query,
  });

  if (!embeddingResponse.ok) {
    throw new Error("Failed to create query embedding");
  }

  const embedding = (await embeddingResponse.json()).data[0]?.embedding;

  // Calculate cosine similarity for each document
  const results = validDocs
    .map((doc) => ({
      content: doc.content,
      similarity: cosineSimilarity(embedding, doc.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, top_k);

  return { query, results };
>>>>>>> Stashed changes
}

/**
 * Computes cosine similarity between two vectors.
 * @param vecA First vector
 * @param vecB Second vector
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

export { cosineSimilarity };
