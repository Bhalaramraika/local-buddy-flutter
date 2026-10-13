/**
 * Client Cache Service
 *
 * AsyncStorage-backed TTL cache for NON-confidential, regularly-used data.
 * Cuts repeated REST requests on every screen mount and makes cold starts
 * render instantly from the last known snapshot.
 *
 * Key format: `lbc:v1:u:<uid>:<domain...>` for user-scoped data,
 * `lbc:v1:g:<domain...>` for global/static data (e.g. meta categories).
 * Bump CACHE_SCHEMA_VERSION to `v2` whenever any cached entry's shape
 * changes — old entries are orphaned and cleaned up by cachePrune().
 *
 * NEVER cache: wallet balance / commissionDue, task OTP secrets, KYC docs,
 * chat messages, bank accounts, SOS/location data, auth tokens.
 *
 * Safety contract: every function is try/catch-wrapped and can NEVER throw.
 * Any failure (corrupt JSON, quota exceeded, missing user) silently degrades
 * to a cache miss → callers fall back to the plain network fetch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosRequestConfig } from 'axios';
import { apiGet } from './api';

// ---------------------------------------------------------------------------
// Key handling
// ---------------------------------------------------------------------------

const CACHE_SCHEMA_VERSION = 'v1';
const KEY_PREFIX = `lbc:${CACHE_SCHEMA_VERSION}:`;

// AsyncStorage values are read across the RN bridge on each access, so cap
// entry size to keep reads cheap and stay far below any device quota.
const MAX_ENTRY_BYTES = 256 * 1024;
// List-type entries are trimmed to this many items (we cache the head of the
// list only; pagination beyond the first page is not cached).
const MAX_LIST_ITEMS = 50;

/** Resolve the current user id without a static import (avoids the
 * cache.ts ↔ authStore.ts ↔ storage.ts import cycle). Safe to call before
 * stores hydrate. */
const resolveUid = (): string | null => {
  try {
    const { useAuthStore } = require('@/store/authStore');
    return useAuthStore.getState().user?.id ?? null;
  } catch {
    return null;
  }
};

/** Build a user-scoped cache key. Returns null when nobody is logged in —
 * callers must treat null as "do not cache". */
export const userCacheKey = (domain: string): string | null => {
  const uid = resolveUid();
  if (!uid) return null;
  return `${KEY_PREFIX}u:${uid}:${domain}`;
};

/** Build a global (not user-scoped) cache key — only for truly static,
 * non-personal data like meta categories. */
export const globalCacheKey = (domain: string): string => {
  return `${KEY_PREFIX}g:${domain}`;
};

/** Same as userCacheKey but for an explicit uid (realtime listeners already
 * know the uid — avoids a store round-trip and keeps the format in one
 * place). Never call with an empty uid. */
export const userCacheKeyFor = (uid: string, domain: string): string => {
  return `${KEY_PREFIX}u:${uid}:${domain}`;
};

// ---------------------------------------------------------------------------
// Entry shape + read/write primitives
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  v: number; // entry format version (intra-schema); currently always 1
  data: T;
  savedAt: number;
  expiresAt: number;
}

const parseEntry = <T>(raw: string | null): CacheEntry<T> | null => {
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || entry.v !== 1 || typeof entry.expiresAt !== 'number') return null;
    return entry;
  } catch {
    return null;
  }
};

/** Fresh data only — expired/stale entries resolve to null. */
export const cacheGet = async <T>(key: string | null): Promise<T | null> => {
  if (!key) return null;
  try {
    const entry = parseEntry<T>(await AsyncStorage.getItem(key));
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) return null;
    return entry.data;
  } catch (error) {
    console.warn('[Cache] get failed:', key, error);
    return null;
  }
};

/** Fresh OR stale data, flagged. Used by the stale-while-revalidate pattern
 * so screens can paint immediately and refresh silently in the background. */
export const cacheGetStale = async <T>(
  key: string | null
): Promise<{ data: T; isStale: boolean } | null> => {
  if (!key) return null;
  try {
    const entry = parseEntry<T>(await AsyncStorage.getItem(key));
    if (!entry) return null;
    return { data: entry.data, isStale: entry.expiresAt <= Date.now() };
  } catch (error) {
    console.warn('[Cache] getStale failed:', key, error);
    return null;
  }
};

/**
 * Write an entry. `ttlMs` comes from CACHE_CONFIG (constants/app.ts).
 * Arrays are trimmed to MAX_LIST_ITEMS. Fire-and-forget safe: never throws.
 */
export const cacheSet = async <T>(key: string | null, data: T, ttlMs: number): Promise<void> => {
  if (!key) return;
  try {
    const trimmed = (Array.isArray(data) ? data.slice(0, MAX_LIST_ITEMS) : data) as T;
    const entry: CacheEntry<T> = {
      v: 1,
      data: trimmed,
      savedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    const serialized = JSON.stringify(entry);
    if (serialized.length > MAX_ENTRY_BYTES) {
      console.warn('[Cache] entry too large, skipping:', key, serialized.length);
      return;
    }
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.warn('[Cache] set failed:', key, error);
  }
};

/** Remove every cache entry whose key starts with `prefix` (e.g. all
 * `tasks:` entries of the current user after a task mutation). */
export const cacheInvalidate = async (prefix: string | null): Promise<void> => {
  if (!prefix) return;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const doomed = keys.filter((k) => k.startsWith(prefix));
    if (doomed.length > 0) await AsyncStorage.multiRemove(doomed);
  } catch (error) {
    console.warn('[Cache] invalidate failed:', prefix, error);
  }
};

/** Remove ALL cached data of one user (logout / account switch). */
export const cacheWipeUser = async (uid: string | null | undefined): Promise<void> => {
  if (!uid) return;
  await cacheInvalidate(`${KEY_PREFIX}u:${uid}:`);
};

/** Remove ALL cache entries (schema bump cleanup, nuclear reset). */
export const cacheWipeAll = async (): Promise<void> => {
  await cacheInvalidate(KEY_PREFIX);
};

/** Drop expired entries. Cheap maintenance — run once per app start. */
export const cachePrune = async (): Promise<void> => {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KEY_PREFIX));
    if (keys.length === 0) return;
    const pairs = await AsyncStorage.multiGet(keys);
    const now = Date.now();
    const doomed: string[] = [];
    for (const [k, raw] of pairs) {
      const entry = parseEntry(raw);
      if (!entry || entry.expiresAt <= now) doomed.push(k);
    }
    if (doomed.length > 0) await AsyncStorage.multiRemove(doomed);
  } catch (error) {
    console.warn('[Cache] prune failed:', error);
  }
};

// ---------------------------------------------------------------------------
// cachedApiGet — one-shot SWR helper for simple screens
// (stores with richer state use cacheGetStale/cacheSet directly instead)
// ---------------------------------------------------------------------------

export interface CachedGetOptions<T> {
  /** Called synchronously with stale cache data before the background
   * refresh resolves — lets the screen paint instantly. */
  onStale?: (data: T) => void;
  /** Axios config (e.g. params). skipGlobalLoader is handled automatically. */
  config?: AxiosRequestConfig;
}

/**
 * Stale-while-revalidate GET:
 * - fresh cache      → resolves immediately, zero network
 * - stale cache      → onStale(stale) fires now, background fetch refreshes
 *   (silently, no GlobalLoader) and resolves with fresh data
 * - miss             → normal fetch (GlobalLoader on)
 * - fetch error      → if stale data was shown, resolves with stale instead
 *   of throwing; otherwise rethrows for the caller's error handling
 */
export const cachedApiGet = async <T>(
  key: string | null,
  url: string,
  ttlMs: number,
  options?: CachedGetOptions<T>
): Promise<T> => {
  const fresh = await cacheGet<T>(key);
  if (fresh !== null) return fresh;

  const stale = await cacheGetStale<T>(key);
  const showedStale = stale !== null && stale.isStale && !!options?.onStale;
  if (showedStale && stale) options!.onStale!(stale.data);

  try {
    const data = await apiGet<T>(url, {
      ...options?.config,
      skipGlobalLoader: stale !== null,
    } as AxiosRequestConfig);
    void cacheSet(key, data, ttlMs);
    return data;
  } catch (error) {
    if (stale) return stale.data;
    throw error;
  }
};
