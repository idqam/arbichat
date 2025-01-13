import { OpenAIApi, Configuration } from "openai-edge";


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;


if (!OPENAI_API_KEY || !KV_REST_API_URL || !KV_REST_API_TOKEN) {
  throw new Error("Missing required environment variables.");
}

const openaiConfig = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setKV = async (key: string, value: any) => {
  const sanitizedKey = encodeURIComponent(key);

  const response = await fetch(`${KV_REST_API_URL}/set/${sanitizedKey}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to set key "${sanitizedKey}": ${response.statusText} - ${errorBody}`
    );
  }

  console.log(`Successfully set key "${sanitizedKey}".`);
};

export const getKV = async (key: string) => {
  const response = await fetch(`${KV_REST_API_URL}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch key "${key}": ${response.statusText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json();
  return data.result;
};

export async function embedAndStoreChunks(
  chunks: { id: string; content: string }[]
) {
  for (const chunk of chunks) {
    try {
      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: chunk.content,
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        throw new Error(
          `Failed to create embedding for chunk "${chunk.id}": ${errorText}`
        );
      }

      const embedding = (await embeddingResponse.json()).data[0]?.embedding;
      if (!embedding) {
        throw new Error(`Embedding not returned for chunk "${chunk.id}"`);
      }

      const kvValue = { chunk: chunk.content, embedding };
      await setKV(chunk.id, kvValue);
    } catch (error) {
      console.error(`Error processing chunk "${chunk.id}":`, error);
    }
  }
}
