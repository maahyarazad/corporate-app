// Shared SQLite handle for every on-device cache.
//
// Two tables live here:
//   api_cache   — whole JSON payloads, keyed by request identity, with a TTL.
//   image_cache — bookkeeping only. The image *bytes* stay on the filesystem
//                 (see cacheImage.js); this table tracks where they are, when
//                 they were written and how big they are, so entries can be
//                 expired, evicted and size-reported without stat-ing the disk.
//
// Everything is best-effort: a cache is an optimisation, so a failure to read
// or write one must never take down the request it was meant to accelerate.

import * as SQLite from "expo-sqlite";
import { Directory, File, Paths } from "expo-file-system";

export const DB_NAME = "cache.db";
export const IMAGE_CACHE_DIR = "images";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS api_cache (
  key      TEXT    PRIMARY KEY NOT NULL,
  value    TEXT    NOT NULL,
  saved_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS image_cache (
  url       TEXT    PRIMARY KEY NOT NULL,
  file_path TEXT    NOT NULL,
  cached_at INTEGER NOT NULL,
  size      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_api_cache_saved_at   ON api_cache (saved_at);
CREATE INDEX IF NOT EXISTS idx_image_cache_cached_at ON image_cache (cached_at);
`;

// `openDatabaseAsync` is expensive and must not run twice concurrently, so the
// *promise* is memoised rather than the resolved handle: callers that arrive
// while the first open is still in flight await the same one.
let dbPromise = null;

export const getDb = () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      // `PRAGMA journal_mode` returns a row, so it can't ride along in the DDL
      // batch below.
      await db.execAsync("PRAGMA journal_mode = WAL");
      await db.execAsync(SCHEMA);
      return db;
    })().catch((error) => {
      // Don't cache a rejected promise, or every later caller inherits the
      // failure and the cache stays permanently broken for this process.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
};

export const getImageCacheDir = () => {
  const dir = new Directory(Paths.cache, IMAGE_CACHE_DIR);
  dir.create({ idempotent: true, intermediates: true });
  return dir;
};

// Deletes every cached row *and* the image bytes those rows point at. Dropping
// the rows alone would orphan the files on disk: nothing else knows their names,
// so they could never be found or reclaimed again.
//
// Returns what was reclaimed so the UI can report it.
export const clearAllCaches = async () => {
  let files = 0;
  let bytes = 0;

  try {
    const db = await getDb();

    const rows = await db.getAllAsync(
      "SELECT file_path, size FROM image_cache"
    );

    for (const row of rows) {
      try {
        const file = new File(row.file_path);
        if (file.exists) {
          bytes += row.size ?? file.size ?? 0;
          file.delete();
          files++;
        }
      } catch (_) {
        // A file we can't delete shouldn't stop us clearing the rest.
      }
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync("DELETE FROM api_cache");
      await db.runAsync("DELETE FROM image_cache");
    });

    // Reclaim the pages the deleted rows were using.
    await db.execAsync("VACUUM");
  } catch (error) {
    console.log("Failed to clear caches:", error);
    throw error;
  }

  // Sweep any image files left behind by an earlier version of this cache (or
  // by a crash between the download and the bookkeeping insert), which have no
  // row pointing at them.
  try {
    const dir = getImageCacheDir();
    for (const entry of dir.list()) {
      if (entry instanceof File && entry.exists) {
        bytes += entry.size ?? 0;
        entry.delete();
        files++;
      }
    }
  } catch (_) {}

  return { files, bytes };
};

// Total bytes currently attributed to the image cache, for display.
export const getCacheSize = async () => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS bytes FROM image_cache"
    );
    const api = await db.getFirstAsync(
      "SELECT COUNT(*) AS count FROM api_cache"
    );
    return {
      images: row?.count ?? 0,
      bytes: row?.bytes ?? 0,
      entries: api?.count ?? 0,
    };
  } catch (_) {
    return { images: 0, bytes: 0, entries: 0 };
  }
};
