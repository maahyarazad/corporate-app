// A tiny file-backed response cache, built on the same expo-file-system
// mechanism as CacheImage: hash the request into a filename under the OS cache
// directory and read/write it synchronously. The only addition here is a TTL —
// images are immutable so they never expire, but API results do, so each entry
// stores the time it was written and is treated as a miss once it's too old.

import { File, Directory, Paths } from "expo-file-system";
import shorthash from "shorthash";

const CACHE_DIR_NAME = "api-cache";
const CACHE_VERSION = "v1"; // bump to invalidate every entry after a shape change
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

const getCacheDir = () => {
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};

const fileForKey = (key) => new File(getCacheDir(), `${key}.json`);

// Stable key from the endpoint + the exact request body. Two requests that post
// the same body (same page, filters, lang, ...) map to the same file.
export const makeCacheKey = (endpoint, body) =>
  shorthash.unique(`${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}`);

// Returns the cached payload if present and still fresh, otherwise null.
// Synchronous — expo-file-system's text read is sync (`textSync`).
export const readCache = (key, ttl = DEFAULT_TTL_MS) => {
  try {
    const file = fileForKey(key);
    if (!file.exists) return null;

    const entry = JSON.parse(file.textSync());
    if (!entry || typeof entry.savedAt !== "number") {
      file.delete(); // corrupt / unexpected shape -> drop it
      return null;
    }

    if (Date.now() - entry.savedAt > ttl) {
      file.delete(); // stale -> drop it so it doesn't linger
      return null;
    }

    return entry.data;
  } catch (_) {
    return null; // any read failure is just a cache miss
  }
};

// Persists a payload stamped with the current time. Best-effort: never throws,
// so a failed cache write can't break the request it was trying to speed up.
export const writeCache = (key, data) => {
  try {
    const file = fileForKey(key);
    if (file.exists) file.delete(); // overwrite cleanly
    file.create();
    file.write(JSON.stringify({ savedAt: Date.now(), data }));
  } catch (_) {
    // ignore cache-write failures
  }
};

// Remove a single entry (e.g. to force a refetch).
export const clearCache = (key) => {
  try {
    const file = fileForKey(key);
    if (file.exists) file.delete();
  } catch (_) {}
};