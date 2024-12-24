import { kv } from "@vercel/kv";
import { OpenAIApi, Configuration } from "openai-edge";

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openaiConfig);

async function embedDocuments() {
  const documents = [
    { key: "knowledge:file1", content: "# File 1 Content" },
    { key: "knowledge:file2", content: "# File 2 Content" },
  ];

  for (const doc of documents) {
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: doc.content,
    });
    const embedding = (await embeddingResponse.json()).data[0]?.embedding;

    // Store embedding in KV
    await kv.set(doc.key, JSON.stringify({ content: doc.content, embedding }));
  }
}

embedDocuments();
