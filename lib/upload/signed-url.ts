import { getSupabaseAdmin } from "@/lib/supabase";
import { UPLOAD_STORAGE_BUCKET } from "@/lib/upload/constants";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60;

function isOwnedStoragePath(path: string, userId: string) {
  return path === userId || path.startsWith(`${userId}/`);
}

export async function createOwnedUploadPartSignedUrl(
  path: string,
  userId: string,
  expiresIn = DEFAULT_SIGNED_URL_TTL_SECONDS,
) {
  if (!isOwnedStoragePath(path, userId)) {
    throw new Error("Storage object not found");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(UPLOAD_STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to create signed URL");
  }

  return data.signedUrl;
}
