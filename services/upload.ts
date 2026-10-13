/**
 * Cloudinary Upload Service
 * Unsigned upload via upload preset (EXPO_PUBLIC_CLOUDINARY_*).
 * Returns the secure_url that we persist on the backend/Firestore.
 *
 * SDK 57 note: `expo/fetch` is the default fetch and its spec-compliant
 * FormData rejects the legacy React Native file object `{ uri, name, type }`
 * with "Unsupported FormDataPart implementation". It also does not reliably
 * accept plain JS-realm `Blob` instances on all Hermes builds.
 *
 * The bulletproof path is the NATIVE multipart uploader from
 * `expo-file-system/legacy` (`FileSystem.uploadAsync`) — no fetch, no
 * FormData, no Blob. As a fallback (e.g. legacy module unavailable), we use
 * the new `expo-file-system` `File` class, which implements the Blob
 * interface and IS accepted by expo/fetch's FormData (see SDK 57 docs).
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

function parseCloudinaryBody(body: string, status: number): CloudinaryUploadResult {
  let json: any = {};
  try {
    json = JSON.parse(body || '{}');
  } catch {
    /* non-JSON error page (e.g. Cloudinary HTML error) */
  }
  if (status >= 400) {
    throw new Error(json?.error?.message || `Cloudinary upload failed (${status})`);
  }
  if (!json.secure_url || !json.public_id) {
    throw new Error(json?.error?.message || 'Cloudinary response missing secure_url');
  }
  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes ?? 0,
    format: json.format ?? 'jpg',
  };
}

/**
 * Upload a local image file (file:// or content:// URI from ImagePicker /
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
  const mime = options?.mimeType || (filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

  const parameters: Record<string, string> = { upload_preset: UPLOAD_PRESET };
  if (options?.folder) parameters.folder = options.folder;

  // ---- Primary: native multipart upload (no fetch/FormData involved) ----
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const FileSystem = require('expo-file-system/legacy');
    if (FileSystem?.uploadAsync && FileSystem?.FileSystemUploadType) {
      const res = await FileSystem.uploadAsync(url, fileUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        parameters,
        mimeType: mime,
      });
      return parseCloudinaryBody(res.body, res.status);
    }
  } catch (err: any) {
    // A transport/upload error is authoritative — report it as-is.
    // Only fall through when the legacy module itself is missing.
    if (!/cannot|undefined|null|module|resolve|import/i.test(String(err?.message ?? err))) {
      throw err;
    }
  }

  // ---- Fallback: expo/fetch FormData with the expo-file-system `File`
  // class (implements Blob; the one part type expo/fetch accepts). ----
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { File } = require('expo-file-system');
  const file = new File(fileUri);

  const data = new FormData();
  data.append('file', file as unknown as Blob, filename);
  data.append('upload_preset', UPLOAD_PRESET);
  if (options?.folder) data.append('folder', options.folder);

  const res = await fetch(url, { method: 'POST', body: data });
  return parseCloudinaryBody(await res.text(), res.status);
}
