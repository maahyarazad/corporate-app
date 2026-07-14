// Hybrid image cache: the filesystem stores the actual image bytes, SQLite
// stores metadata about those files (path, write time, size) so the cache can
// be expired, evicted and size-reported without walking the disk.
//
// The two halves can drift apart — the OS may reclaim the cache directory at any
// time, and a crash between the download and the bookkeeping insert leaves a
// file with no row. Every lookup therefore checks *both*, and self-heals when
// they disagree, so a row is never trusted as proof that the bytes still exist.

import { File } from "expo-file-system";
import shorthash from "shorthash";
import { getDb, getImageCacheDir } from "./cacheDb";

const getSafeExtension = (url = "") => {
  const cleanUrl = url.split("?")[0];
  const match = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
};

// Deterministic on-disk location for a URL, so a download can be targeted at a
// known path rather than whatever name the server implies.
export const fileForUrl = (encodedUri) =>
  new File(
    getImageCacheDir(),
    `${shorthash.unique(encodedUri)}${getSafeExtension(encodedUri)}`
  );

// Resolves to the cached file's uri, or null on a miss. A row that points at a
// file which no longer exists is deleted rather than returned.
export const getCachedImage = async (encodedUri) => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT file_path FROM image_cache WHERE url = ?",
      encodedUri
    );

    if (!row) return null;

    if (!new File(row.file_path).exists) {
      await removeCachedImage(encodedUri);
      return null;
    }

    return row.file_path;
  } catch (_) {
    return null; // any bookkeeping failure is just a cache miss
  }
};

// Records where a freshly downloaded image landed. Best-effort: if this fails
// the bytes are still on disk and usable, we just lose the bookkeeping and will
// re-download next time.
export const putCachedImage = async (encodedUri, file) => {
  try {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO image_cache (url, file_path, cached_at, size) VALUES (?, ?, ?, ?)",
      encodedUri,
      file.uri,
      Date.now(),
      file.size ?? null
    );
  } catch (_) {}
};

// Drops both halves of the entry: the bytes and the row that points at them.
export const removeCachedImage = async (encodedUri) => {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync(
      "SELECT file_path FROM image_cache WHERE url = ?",
      encodedUri
    );

    if (row) {
      try {
        const file = new File(row.file_path);
        if (file.exists) file.delete();
      } catch (_) {}
    }

    await db.runAsync("DELETE FROM image_cache WHERE url = ?", encodedUri);
  } catch (_) {}
};
