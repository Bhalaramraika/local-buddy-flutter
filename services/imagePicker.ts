/**
 * Image Picker Service
 * Based on Architecture.md - expo-image-picker with compression
 * Handles camera, gallery, and document picking with compression
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';


export interface ImagePickerOptions {
  mediaTypes?: ImagePicker.MediaTypeOptions;
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  base64?: boolean;
  exif?: boolean;
}

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
  base64?: string;
  exif?: Record<string, any>;
}

export interface PickedDocument {
  uri: string;
  name: string;
  size: number;
  mimeType?: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

// Default compression settings
const DEFAULT_COMPRESSION: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: SaveFormat.JPEG,
};

const DOCUMENT_COMPRESSION: CompressionOptions = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.9,
  format: SaveFormat.JPEG,
};

// Permission handling
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ImagePicker] Camera permission error:', error);
    return false;
  }
};

export const requestGalleryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ImagePicker] Gallery permission error:', error);
    return false;
  }
};

export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ImagePicker] Check camera permission error:', error);
    return false;
  }
};

export const checkGalleryPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('[ImagePicker] Check gallery permission error:', error);
    return false;
  }
};

// Image picking
export const pickImageFromGallery = async (
  options: ImagePickerOptions = {}
): Promise<PickedImage | null> => {
  try {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) {
      const granted = await requestGalleryPermission();
      if (!granted) {
        throw new Error('Gallery permission denied');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect || [1, 1],
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
      exif: options.exif ?? false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType ?? undefined,
      fileName: asset.fileName ?? undefined,
      fileSize: asset.fileSize ?? undefined,
      base64: asset.base64 ?? undefined,
      exif: asset.exif ?? undefined,
    };
  } catch (error) {
    console.error('[ImagePicker] Pick from gallery error:', error);
    throw error;
  }
};

export const takePhoto = async (
  options: ImagePickerOptions = {}
): Promise<PickedImage | null> => {
  try {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        throw new Error('Camera permission denied');
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options.allowsEditing ?? true,
      aspect: options.aspect || [1, 1],
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
      exif: options.exif ?? false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType ?? undefined,
      fileName: asset.fileName ?? undefined,
      fileSize: asset.fileSize ?? undefined,
      base64: asset.base64 ?? undefined,
      exif: asset.exif ?? undefined,
    };
  } catch (error) {
    console.error('[ImagePicker] Take photo error:', error);
    throw error;
  }
};

export const pickMultipleImages = async (
  options: ImagePickerOptions & { maxCount?: number } = {}
): Promise<PickedImage[]> => {
  try {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) {
      const granted = await requestGalleryPermission();
      if (!granted) {
        throw new Error('Gallery permission denied');
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: options.quality ?? 0.8,
      base64: options.base64 ?? false,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    const maxCount = options.maxCount || 10;
    return result.assets.slice(0, maxCount).map(asset => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType ?? undefined,
      fileName: asset.fileName ?? undefined,
      fileSize: asset.fileSize ?? undefined,
      base64: asset.base64 ?? undefined,
      exif: asset.exif ?? undefined,
    }));
  } catch (error) {
    console.error('[ImagePicker] Pick multiple images error:', error);
    throw error;
  }
};

// Document picking
export const pickDocument = async (
  allowedTypes?: string[]
): Promise<PickedDocument | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: allowedTypes || [
        'application/pdf',
        'image/*',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.name,
      size: asset.size ?? 0,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    };
  } catch (error) {
    console.error('[ImagePicker] Pick document error:', error);
    throw error;
  }
};

export const pickMultipleDocuments = async (
  allowedTypes?: string[]
): Promise<PickedDocument[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: allowedTypes || ['*/*'],
      copyToCacheDirectory: true,
      multiple: true,
    });

    if (result.canceled || !result.assets) {
      return [];
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      size: asset.size ?? 0,
      mimeType: asset.mimeType ?? 'application/octet-stream',
    }));
  } catch (error) {
    console.error('[ImagePicker] Pick multiple documents error:', error);
    throw error;
  }
};

// Image compression
export const compressImage = async (
  uri: string,
  options: CompressionOptions = {}
): Promise<PickedImage> => {
  const opts = { ...DEFAULT_COMPRESSION, ...options };
  
  try {
    const ctx = ImageManipulator.manipulate(uri)
      .resize({ width: opts.maxWidth, height: opts.maxHeight });
    const rendered = await ctx.renderAsync();
    const result = await rendered.saveAsync({ compress: opts.quality, format: opts.format, base64: false });

    // Get file info
    const fileInfo = await getFileInfo(result.uri);
    
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: fileInfo.size,
      fileName: fileInfo.name,
    };
  } catch (error) {
    console.error('[ImagePicker] Compress image error:', error);
    throw error;
  }
};

export const compressImageForUpload = async (uri: string): Promise<PickedImage> => {
  return compressImage(uri, DEFAULT_COMPRESSION);
};

export const compressDocumentImage = async (uri: string): Promise<PickedImage> => {
  return compressImage(uri, DOCUMENT_COMPRESSION);
};

// Batch compression
export const compressImages = async (
  uris: string[],
  options: CompressionOptions = {}
): Promise<PickedImage[]> => {
  const results = await Promise.all(
    uris.map(uri => compressImage(uri, options).catch(err => {
      console.error('[ImagePicker] Batch compress error:', err);
      return null;
    }))
  );
  return results.filter((r): r is PickedImage => r !== null);
};

// Utility functions
const getFileInfo = async (uri: string): Promise<{ size: number; name: string }> => {
  try {
    // For React Native, we can't easily get file size from URI
    // This is a fallback - in production, you might use react-native-fs
    const response = await fetch(uri);
    const blob = await response.blob();
    return {
      size: blob.size,
      name: uri.split('/').pop() || 'image.jpg',
    };
  } catch {
    return { size: 0, name: 'image.jpg' };
  }
};

export const getImageDimensions = async (uri: string): Promise<{ width: number; height: number }> => {
  try {
    const rendered = await ImageManipulator.manipulate(uri).renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG });
    return { width: result.width, height: result.height };
  } catch (error) {
    console.error('[ImagePicker] Get dimensions error:', error);
    return { width: 0, height: 0 };
  }
};

export const createThumbnail = async (
  uri: string,
  size: number = 200
): Promise<string> => {
  try {
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: size, height: size })
      .renderAsync();
    const result = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return result.uri;
  } catch (error) {
    console.error('[ImagePicker] Create thumbnail error:', error);
    return uri;
  }
};

// Validation
export const validateImageFile = (file: PickedImage, maxSizeMB: number = 10): { valid: boolean; error?: string } => {
  if (!file.uri) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.fileSize && file.fileSize > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (file.type && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed' };
  }

  return { valid: true };
};

export const validateDocumentFile = (file: PickedDocument, maxSizeMB: number = 25): { valid: boolean; error?: string } => {
  if (!file.uri) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (file.mimeType && !allowedTypes.includes(file.mimeType)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX' };
  }

  return { valid: true };
};

// Convert to base64 for API upload
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[ImagePicker] Base64 conversion error:', error);
    throw error;
  }
};

// Clean up cached images
export const clearImageCache = async (): Promise<void> => {
  try {
    if (Platform.OS !== 'web') {
      const FileSystem = await import('expo-file-system/legacy');
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);
        const imageFiles = files.filter((f: string) =>
          f.match(/\.(jpg|jpeg|png|webp|heic)$/i)
        );
        await Promise.all(
          imageFiles.map((f: string) => FileSystem.deleteAsync(`${cacheDir}${f}`, { idempotent: true }))
        );
      }
    }
  } catch (error) {
    console.error('[ImagePicker] Clear cache error:', error);
  }
};

export default {
  requestCameraPermission,
  requestGalleryPermission,
  checkCameraPermission,
  checkGalleryPermission,
  pickImageFromGallery,
  takePhoto,
  pickMultipleImages,
  pickDocument,
  pickMultipleDocuments,
  compressImage,
  compressImageForUpload,
  compressDocumentImage,
  compressImages,
  getImageDimensions,
  createThumbnail,
  validateImageFile,
  validateDocumentFile,
  imageToBase64,
  clearImageCache,
};