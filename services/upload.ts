/**
 * Cloudinary Upload Service
 * Unsigned upload via upload preset (EXPO_PUBLIC_CLOUDINARY_*).
 * Returns the secure_url that we persist on the backend/Firestore.
 *
 * SDK 57 note: `expo/fetch` is the default fetch and its spec-compliant
 * FormData rejects the legacy React Native file object `{ uri, name, type }`
 * with "Unsupported FormDataPart implementation" (see expo's
 * src/winter/fetch/convertFormData.ts). This module therefore contains
 * **no FormData at all** — two transports, both FormData-free:
 *
 *  1. `expo-file-system/legacy` `uploadAsync` — native multipart upload
 *     straight from the file URI (no fetch, no FormData, no Blob).
 *  2. base64 data-URI **JSON** POST — `readAsStringAsync(base64)` + a plain
 *     `{ "file": "data:image/jpeg;base64,…" }` JSON body; Cloudinary accepts
 *     it directly. Used if the native multipart path is unavailable/fails.
 */

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
}

function cloudinaryUrl(): string {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary not configured (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME)');
  }
  return `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
}

function parseCloudinaryJson(json: any, status: number): CloudinaryUploadResult {
  if (status >= 400) {
    throw new Error(json?.error?.message || `Cloudinary upload failed (${status})`);
  }
  if (!json?.secure_url || !json?.public_id) {
    throw new Error(json?.error?.message || 'Cloudinary response missing secure_url');
  }
  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes ?? 0,
    format: json.format ?? 'jpg',
  };
}

function parseCloudinaryBody(body: string, status: number): CloudinaryUploadResult {
  let json: any = {};
  try {
    json = JSON.parse(body || '{}');
  } catch {
    /* non-JSON error page (e.g. Cloudinary HTML error) */
  }
  return parseCloudinaryJson(json, status);
}

function guessMime(filename: string, override?: string): string {
  if (override) return override;
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/** Tier 1 — native multipart upload (no fetch/FormData anywhere). */
async function uploadViaNativeMultipart(
  url: string,
  fileUri: string,
  params: Record<string, string>,
  mime: string
): Promise<CloudinaryUploadResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FileSystem = require('expo-file-system/legacy');
  if (!FileSystem?.uploadAsync || !FileSystem?.FileSystemUploadType) {
    throw new Error('expo-file-system legacy module unavailable');
  }
  const res = await FileSystem.uploadAsync(url, fileUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    parameters: params,
    mimeType: mime,
  });
  return parseCloudinaryBody(res.body, res.status);
}

/** Tier 2 — base64 data-URI JSON POST (plain fetch, JSON body, no FormData). */
async function uploadViaBase64Json(
  url: string,
  fileUri: string,
  params: Record<string, string>,
  mime: string
): Promise<CloudinaryUploadResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const FileSystem = require('expo-file-system/legacy');
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
  if (!base64) throw new Error('Could not read the selected file');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...params, file: `data:${mime};base64,${base64}` }),
  });
  return parseCloudinaryBody(await res.text(), res.status);
}

/**
 * Upload a local image (file:// or content:// URI from ImagePicker /
 * DocumentPicker) to Cloudinary. Used for KYC documents and avatars.
 * Requires the upload preset to allow unsigned uploads (Cloudinary Console
 * → Settings → Upload → Upload presets).
 */
export async function uploadToCloudinary(
  fileUri: string,
  options?: { folder?: string; mimeType?: string }
): Promise<CloudinaryUploadResult> {
  const url = cloudinaryUrl();
  const filename = fileUri.split('/').pop()?.split('?')[0] || 'upload.jpg';
  const mime = guessMime(filename, options?.mimeType);

  const params: Record<string, string> = { upload_preset: UPLOAD_PRESET };
  if (options?.folder) params.folder = options.folder;

  try {
    return await uploadViaNativeMultipart(url, fileUri, params, mime);
  } catch (nativeErr: any) {
    console.warn('[Upload] native multipart failed, using base64 JSON fallback:', nativeErr?.message ?? nativeErr);
    return uploadViaBase64Json(url, fileUri, params, mime);
  }
}
