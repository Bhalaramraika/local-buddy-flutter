/**
 * Cloudinary Upload Service
 * Unsigned upload via upload preset (EXPO_PUBLIC_CLOUDINARY_*).
 * Returns the secure_url that we persist on the backend/Firestore.
 */

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  bytes: number;
  format: string;
}

/**
 * Upload a local image file (file:// URI from ImagePicker) to Cloudinary.
 * Used for KYC documents / avatars. Requires upload preset to allow
 * unsigned uploads (Cloudinary Console → Settings → Upload → Upload presets).
 */
export async function uploadToCloudinary(
  fileUri: string,
  options?: { folder?: string; mimeType?: string }
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary not configured (EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME)');
  }

  const data = new FormData();
  const filename = fileUri.split('/').pop() || 'upload.jpg';
  const mime = options?.mimeType || (filename.endsWith('.png') ? 'image/png' : 'image/jpeg');

  // React Native FormData file-like shape
  data.append('file', {
    uri: fileUri,
    name: filename,
    type: mime,
  } as any);
  data.append('upload_preset', UPLOAD_PRESET);
  if (options?.folder) data.append('folder', options.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: data }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message || `Cloudinary upload failed (${res.status})`);
  }

  const json = await res.json() as { secure_url?: string; public_id?: string; bytes?: number; format?: string };
  if (!json.secure_url || !json.public_id) {
    throw new Error('Cloudinary response missing secure_url');
  }

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes ?? 0,
    format: json.format ?? 'jpg',
  };
}
