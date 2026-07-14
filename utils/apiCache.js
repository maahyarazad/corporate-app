// A SQLite-backed response cache. Each entry is a whole JSON payload keyed by
// request identity, stamped with the time it was written; images are immutable
// so they never expire, but API results do, and an entry past its TTL is treated
// as a miss.
//
// This replaced a file-per-entry cache built on expo-file-system. Reads used to
// be synchronous (`textSync`); SQLite is async-only, so `readCache`, `writeCache`
// and `clearCache` now return promises.

import shorthash from "shorthash";
import { getDb } from "./cacheDb";

const CACHE_VERSION = "v1"; // bump to invalidate every entry after a shape change
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

// Stable key from the endpoint + the exact request body. Two requests that post
// the same body (same page, filters, lang, ...) map to the same row.
export const makeCacheKey = (endpoint, body) =>
  shorthash.unique(`${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}`);

// Resolves to the cached payload if present and still fresh, otherwise null.
// Any failure — including a row whose `value` won't parse — is just a miss.
export const readCache = async (key, ttl = DEFAULT_TTL_MS) => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT value, saved_at FROM api_cache WHERE key = ?",
      key
    );

    if (!row) return null;

    if (typeof row.saved_at !== "number" || Date.now() - row.saved_at > ttl) {
      // Stale (or a corrupt timestamp) -> drop it so it doesn't linger.
      await clearCache(key);
      return null;
    }

    return JSON.parse(row.value);
  } catch (_) {
    return null;
  }
};

// Persists a payload stamped with the current time. Best-effort: never throws,
// so a failed cache write can't break the request it was trying to speed up.
export const writeCache = async (key, data) => {
  try {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO api_cache (key, value, saved_at) VALUES (?, ?, ?)",
      key,
      JSON.stringify(data),
      Date.now()
    );
  } catch (_) {
    // ignore cache-write failures
  }
};

// Remove a single entry (e.g. to force a refetch).
export const clearCache = async (key) => {
  try {
    const db = await getDb();
    await db.runAsync("DELETE FROM api_cache WHERE key = ?", key);
  } catch (_) {}
};
