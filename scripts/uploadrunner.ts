import fs from "fs/promises";
import path from "path";
import { embedAndStoreChunks } from "../src/app/api/chat/embedding";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preprocessedFolder = path.resolve(
  __dirname,
  "../src/app/documents/preprocessed"
);

(async () => {
  try {
    const files = await fs.readdir(preprocessedFolder);

    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(preprocessedFolder, file);
      const preprocessedData = JSON.parse(await fs.readFile(filePath, "utf-8"));

      const { document, chunks } = preprocessedData;

      console.log(`Embedding and storing chunks for document: ${document}`);

      await embedAndStoreChunks(chunks);
    }

    console.log("Upload completed successfully.");
  } catch (error) {
    console.error("Error during upload process:", error);
  }
})();
