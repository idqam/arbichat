import fs from "fs/promises";
import path from "path";
import { chunkText } from "@/utils/chunking";
import { fileURLToPath } from "url";
import { extractPlainText } from "@/utils/plaintext";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const markdownFolder = path.resolve(__dirname, "../src/app/documents"); // Source folder
const outputFolder = path.resolve(markdownFolder, "preprocessed"); // Output folder

(async () => {
  try {
    await fs.mkdir(outputFolder, { recursive: true });
    const loadfiles = await fs.readdir(markdownFolder);
    const markdowns = loadfiles.filter((file) => file.endsWith(".mdx"));

    for (const file of markdowns) {
      const sanitizedFileName = file.replace(/-/g, "_");
      const filePath = path.join(markdownFolder, file);
      const outputFilePath = path.join(
        outputFolder,
        `${path.basename(sanitizedFileName, ".mdx")}.json`
      );

      console.log(`Processing: ${filePath} -> ${outputFilePath}`);

      const content = await fs.readFile(filePath, "utf-8");
      const plainText = await extractPlainText(content);

      const chunks = chunkText(plainText, 300);

      const output = {
        document: sanitizedFileName.replace(".mdx", ""),
        chunks: chunks.map((chunk, index) => ({
          id: `${sanitizedFileName}_chunk_${index}`,
          content: chunk,
        })),
      };

      await fs.writeFile(
        outputFilePath,
        JSON.stringify(output, null, 2),
        "utf-8"
      );

      console.log(`Preprocessed and saved: ${outputFilePath}`);
    }

    console.log("Files processed successfully");
  } catch (e) {
    console.error("Error preprocessing:", e);
  }
})();
