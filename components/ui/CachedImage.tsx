/**
 * CachedImage — drop-in replacement for react-native <Image> for REMOTE
 * images (task photos, avatars, chat media).
 *
 * Wraps expo-image with disk+memory caching ("memory-disk"), so images are
 * downloaded once per device and survive app restarts instead of being
 * re-fetched every session by RN Image.
 *
 * API matches the RN Image props this codebase actually uses:
 * `source={{ uri }}`, `style`, `resizeMode` (mapped to contentFit).
 * Local require() assets can also pass through unchanged.
 */

import React from 'react';
import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image';

type RNResizeMode = 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';

interface CachedImageProps extends Omit<ExpoImageProps, 'contentFit' | 'cachePolicy' | 'transition'> {
  /** RN-style resizeMode is mapped to expo-image contentFit. An explicit
   * `contentFit` prop wins if both are given. */
  resizeMode?: RNResizeMode;
  /** Direct expo-image contentFit override (wins over resizeMode). */
  contentFit?: ExpoImageProps['contentFit'];
  /** Override cache policy (default: memory + disk). */
  cachePolicy?: ExpoImageProps['cachePolicy'];
}

const RESIZE_TO_FIT: Record<RNResizeMode, NonNullable<ExpoImageProps['contentFit']>> = {
  cover: 'cover',
  contain: 'contain',
  stretch: 'fill',
  center: 'scale-down',
  repeat: 'fill',
};

export function CachedImage({
  resizeMode = 'cover',
  contentFit,
  cachePolicy = 'memory-disk',
  recyclingKey,
  source,
  ...rest
}: CachedImageProps) {
  const uri =
    typeof source === 'object' && !Array.isArray(source) && source !== null
      ? (source as { uri?: string }).uri
      : undefined;
  return (
    <ExpoImage
      source={source}
      contentFit={contentFit ?? RESIZE_TO_FIT[resizeMode]}
      cachePolicy={cachePolicy}
      transition={150}
      recyclingKey={recyclingKey ?? uri}
      {...rest}
    />
  );
}

export default CachedImage;
