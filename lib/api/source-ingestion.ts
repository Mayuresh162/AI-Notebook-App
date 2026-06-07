import { ingestDocument } from "@/lib/ingest";
import {
  getRequiredString,
  jsonError,
  readJsonObject,
  validatePublicUrl,
} from "@/lib/security";

const MAX_INGEST_TEXT_LENGTH = 500_000;

type SourceMetadata = {
  source: string;
  name?: string;
  url?: string;
  fileType?: string;
  created_at?: string;
};

type LoadedSource = {
  text: string;
};

type UrlIngestionOptions = {
  source: string;
  allowedHosts?: string[];
  load: (url: string) => Promise<LoadedSource>;
};

function getChunkCount(ingestResult: Awaited<ReturnType<typeof ingestDocument>>) {
  if (ingestResult instanceof Response) {
    return ingestResult.json().then((data) => data.chunks);
  }

  return ingestResult.chunks;
}

export async function ingestTextForUser(
  text: string,
  metadata: SourceMetadata,
  userId: string,
) {
  if (text.length > MAX_INGEST_TEXT_LENGTH) {
    return jsonError("Ingested content is too large", 413);
  }

  const ingestResult = await ingestDocument(text, metadata, userId);
  const chunks = await getChunkCount(ingestResult);

  return Response.json({ chunks });
}

export async function ingestTextRequest(req: Request, userId: string) {
  const body = await readJsonObject(req);

  if (body.error) return body.error;

  const textResult = getRequiredString(body.data, "text");

  if (textResult.error) return textResult.error;

  const text = textResult.value;

  return ingestTextForUser(
    text,
    {
      source: "text",
      name: text.slice(0, 120),
    },
    userId,
  );
}

export async function ingestUrlRequest(
  req: Request,
  userId: string,
  options: UrlIngestionOptions,
) {
  const body = await readJsonObject(req);

  if (body.error) return body.error;

  const urlResult = getRequiredString(body.data, "url", 2_048);

  if (urlResult.error) return urlResult.error;

  const safeUrl = validatePublicUrl(urlResult.value, options.allowedHosts);

  if (safeUrl.error) return safeUrl.error;

  const result = await options.load(safeUrl.url);

  return ingestTextForUser(
    result.text,
    {
      source: options.source,
      url: safeUrl.url,
    },
    userId,
  );
}
