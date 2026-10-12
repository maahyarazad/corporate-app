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

// Cache activity is invisible by construction - a hit looks exactly like a fast
// request. This makes it observable in development without shipping the noise:
// __DEV__ is false in production and babel's transform-remove-console strips the
// call entirely from the release bundle.
const debug = (event, detail) => {
  if (__DEV__) console.log(`[apiCache] ${event}`, detail);
};

const CACHE_VERSION = "v2"; // bump to invalidate every entry after a shape change
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

// Stable key from the endpoint + the exact request body. Two requests that post
// the same body (same page, filters, lang, ...) map to the same row.
//
// `scopeId` is the account the response belongs to, folded into the hash so two
// users on one device can never read each other's row. Omitted for shared data,
// where a single row serving everyone is the point.
//
// `policyId` is optional and, when given, is kept as a readable prefix rather
// than folded into the hash. That is what makes `clearCacheByPolicy` possible:
// one policy covers many keys - every partner id, every language - and a hash
// cannot be searched. Callers that pass no policyId (location-list.screen.js,
// map.screen.js) get the original bare-hash behaviour.
export const makeCacheKey = (endpoint, body, policyId, scopeId) => {
  const hash = shorthash.unique(
    `${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}::${scopeId ?? "shared"}`
  );

  return policyId ? `${policyId}::${hash}` : hash;
};

// Resolves to the cached payload if present and still fresh, otherwise null.
// Any failure — including a row whose `value` won't parse — is just a miss.
export const readCache = async (key, ttl = DEFAULT_TTL_MS) => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT value, saved_at FROM api_cache WHERE key = ?",
      key
    );

    if (!row) {
      debug("miss", key);
      return null;
    }

    if (typeof row.saved_at !== "number" || Date.now() - row.saved_at > ttl) {
      // Stale (or a corrupt timestamp) -> drop it so it doesn't linger.
      await clearCache(key);
      debug("stale", key);
      return null;
    }

    const value = JSON.parse(row.value);

    debug("hit", key);
    return value;
  } catch (_) {
    // Includes a `value` that will not parse - a corrupt row is a miss, not a
    // crash.
    debug("error->miss", key);
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
    debug("write", key);
  } catch (_) {
    // ignore cache-write failures
  }
};

// Removes every entry belonging to one policy.
//
// Used by mutation-driven invalidation: a policy matches many urls, so its rows
// are addressed by the prefix `makeCacheKey` writes rather than one at a time.
// Policy ids are our own kebab-case constants, so they contain no LIKE
// wildcards to escape.
export const clearCacheByPolicy = async (policyId) => {
  if (!policyId) return;

  try {
    const db = await getDb();
    await db.runAsync("DELETE FROM api_cache WHERE key LIKE ?", `${policyId}::%`);
    debug("invalidate", policyId);
  } catch (_) {}
};

// Remove a single entry (e.g. to force a refetch).
export const clearCache = async (key) => {
  try {
    const db = await getDb();
    await db.runAsync("DELETE FROM api_cache WHERE key = ?", key);
  } catch (_) {}
};
