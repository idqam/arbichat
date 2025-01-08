import path from "path";
import { uploadDocuments } from "./embedding";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const files = [path.resolve(__dirname, "01-a-gentle-introduction.mdx")];

  console.log("Starting document upload...");

  try {
    await uploadDocuments(files);

    console.log("Document upload completed successfully.");
  } catch (error) {
    console.error("An error occurred during document upload:", error);
  }
})();
