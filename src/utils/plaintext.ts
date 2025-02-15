import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkStringify from "remark-stringify";

export async function extractPlainText(mdxContent: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkStringify);

  const processed = await processor.process(mdxContent);

  return String(processed).trim();
}
