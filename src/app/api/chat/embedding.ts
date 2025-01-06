import fetch from "node-fetch";
import { OpenAIApi, Configuration } from "openai-edge";
import dotenv from "dotenv";
import path from "path";

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);
console.log("KV_REST_API_URL:", process.env.KV_REST_API_URL);
console.log("KV_REST_API_TOKEN:", process.env.KV_REST_API_TOKEN);

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const result = dotenv.config({ path: path.resolve(process.cwd(), ".env") });
if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log("Loaded environment variables:", result.parsed);
}

if (
  !process.env.OPENAI_API_KEY ||
  !process.env.KV_REST_API_URL ||
  !process.env.KV_REST_API_TOKEN
) {
  throw new Error("Missing required environment variables.");
}

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

const setKV = async (key: string, value: string) => {
  const sanitizedKey = encodeURIComponent(key);
  const sanitizedValue = encodeURIComponent(value);

  const url = `${process.env.KV_REST_API_URL}/set/${sanitizedKey}/${sanitizedValue}`;
  const token = process.env.KV_REST_API_TOKEN;

  console.log("Request URL:", url);
  console.log("Authorization Token:", token);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("KV Store Error Response:", errorBody);
    throw new Error(
      `Failed to set key "${sanitizedKey}": ${response.statusText}`
    );
  }

  console.log(
    `Successfully set key "${sanitizedKey}" with value "${sanitizedValue}".`
  );
};

const getKV = async (key: string) => {
  const response = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch key "${key}": ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
};

async function documentEmbedder() {
  try {
    const documents = [
      { key: "knowledgefile_4", content: "# File 1 Content" },
      {
        key: "knowledgefile_3",
        content: "THIS IS THE SECOND KNOWLEDGE. A POKEMON EXISTS ",
      },
    ];

    for (const doc of documents) {
      console.log(`Processing document: ${doc.key}`);

      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: doc.content,
      });

      if (!embeddingResponse.ok) {
        const errorBody = await embeddingResponse.text();
        throw new Error(
          `Failed to fetch embedding for "${doc.key}": ${embeddingResponse.statusText}, ${errorBody}`
        );
      }

      const responseBody = await embeddingResponse.json();
      console.log("Embedding API Response:", responseBody);

      if (
        !responseBody.data ||
        !Array.isArray(responseBody.data) ||
        responseBody.data.length === 0
      ) {
        throw new Error(
          `Invalid API response for document "${doc.key}": ${JSON.stringify(
            responseBody
          )}`
        );
      }

      const embedding = responseBody.data[0]?.embedding;
      if (!embedding) {
        throw new Error(`Failed to extract embedding for key: ${doc.key}`);
      }

      const value = JSON.stringify({ content: doc.content, embedding });
      await setKV(doc.key, value);

      console.log(`Embedded and saved for key: ${doc.key}`);
    }
  } catch (error) {
    console.error("Error in embedDocuments:", error);
  }
}

documentEmbedder();
