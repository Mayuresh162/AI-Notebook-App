import { inflateRawSync } from "node:zlib";

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "js",
  "ts",
  "jsx",
  "tsx",
]);

const MAX_FILES = 100;
const MAX_EXTRACTED_CHARS = 500_000;
const NESTED_ARCHIVE_EXTENSIONS = new Set([
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "bz2",
  "xz",
]);

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isUnsafeZipPath(name: string) {
  if (name.startsWith("/") || name.startsWith("\\") || /^[a-zA-Z]:/.test(name)) {
    return true;
  }

  return name.split(/[\\/]+/).includes("..");
}

function decodeUtf8(buffer: Buffer) {
  return new TextDecoder("utf-8", {
    fatal: true,
  }).decode(buffer);
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      return i;
    }
  }

  return -1;
}

function readFileData(buffer: Buffer, localHeaderOffset: number, compressedSize: number) {
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error("Invalid ZIP local file header");
  }

  const nameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + nameLength + extraLength;

  return buffer.subarray(dataStart, dataStart + compressedSize);
}

export async function loadZip(buffer: Buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);

  if (eocdOffset < 0) {
    throw new Error("Invalid ZIP file");
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const extracted: string[] = [];

  if (entryCount > MAX_FILES) {
    throw new Error("ZIP contains too many files");
  }

  let offset = centralDirectoryOffset;
  let extractedChars = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid ZIP central directory");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer
      .subarray(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    offset += 46 + fileNameLength + extraLength + commentLength;

    if (isUnsafeZipPath(fileName)) {
      throw new Error("ZIP contains an unsafe file path");
    }

    const extension = getExtension(fileName);

    if (NESTED_ARCHIVE_EXTENSIONS.has(extension)) {
      throw new Error("ZIP contains a nested archive");
    }

    if (fileName.endsWith("/") || !TEXT_EXTENSIONS.has(extension)) {
      continue;
    }

    const compressed = readFileData(buffer, localHeaderOffset, compressedSize);
    const contentBuffer =
      compressionMethod === 0
        ? compressed
        : compressionMethod === 8
          ? inflateRawSync(compressed)
          : null;

    if (!contentBuffer) continue;

    const content = decodeUtf8(contentBuffer).trim();

    if (!content) continue;

    const section = `File: ${fileName}\n\n${content}`;

    if (extractedChars + section.length > MAX_EXTRACTED_CHARS) {
      break;
    }

    extractedChars += section.length;
    extracted.push(section);
  }

  if (!extracted.length) {
    throw new Error("ZIP did not contain supported text or markdown files");
  }

  return {
    text: extracted.join("\n\n---\n\n"),
    source: "zip",
  };
}
