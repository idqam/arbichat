import fs from "fs/promises";
export async function extractContentFromMDX(filePath: string): Promise<string> {
  const mdxContent = await fs.readFile(filePath, "utf-8");
  return mdxContent;
}
