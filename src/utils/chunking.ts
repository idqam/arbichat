export function chunkText(text: string, maxTokens: number = 300): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.?!])\s+/);

  let currentChunk = "";

  for (const sentence of sentences) {
    const tentativeChunk = currentChunk
      ? `${currentChunk} ${sentence}`
      : sentence;

    if (tentativeChunk.length / 4 > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk = tentativeChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
