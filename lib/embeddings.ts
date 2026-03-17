import { pipeline } from "@xenova/transformers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any;

export async function getEmbedding(text: string) {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data) as number[];
}
