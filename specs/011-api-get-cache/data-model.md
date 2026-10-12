# Phase 1 Data Model: SQLite Caching for GET Requests

**Feature**: 011-api-get-cache | **Date**: 2026-09-08

No new tables. `api_cache` in `utils/cacheDb.js` already has the right shape; the
entities below are the in-memory structures that decide what goes into it.

---

## E1. `api_cache` row (existing, unchanged)

```sql
CREATE TABLE IF NOT EXISTS api_cache (
  key      TEXT    PRIMARY KEY NOT NULL,
  value    TEXT    NOT NULL,     -- JSON.stringify of the whole payload
  saved_at INTEGER NOT NULL      -- Date.now() at write
);
CREATE INDEX IF NOT EXISTS idx_api_cache_saved_at ON api_cache (saved_at);
```

The `saved_at` index already exists and currently serves nothing — the sweep in
`research.md` R5 is its first real consumer.

**Schema change: none.** That is deliberate; it means Phase A ships without a
migration.

---

## E2. `CacheKey` — what identifies an entry

Today (`utils/apiCache.js`):

```
shorthash.unique(`${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}`)
```

Proposed, with a fourth segment:

```
shorthash.unique(`${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}::${scope}`)
```

| `scope` value | Used for | Rationale |
|---|---|---|
| `"shared"` | Endpoints identical for every account | Partner categories, tags, hotpicks — one row serves all users, which is the point |
| `<account id>` | Endpoints whose response depends on the caller | Two accounts on one device get two rows and cannot read each other's |

**Backwards compatibility**: adding a segment changes every hash, which silently
invalidates the rows `location-list` and `map` have already written. That is
acceptable — they refill on the next fetch — but it must be a deliberate
statement rather than a surprise, so `CACHE_VERSION` is bumped `v1` → `v2` in the
same change. The existing comment on `CACHE_VERSION` already describes this as
its purpose.

**Validation**: a `scope` of anything other than `"shared"` requires a non-empty
account id. If the id is unavailable (not yet signed in, still loading), the
entry is **not cached** — a miss is always safe, a wrongly-scoped row is not.

---

## E3. `CachePolicy` — one entry per cacheable endpoint

The allowlist. Lives in `utils/cachePolicy.js`.

```
{
  match:         string | RegExp   // matched against the request url
  ttlMs:         number            // overrides the 1h default
  scope:         "shared" | "user"
  invalidatedBy: string[]          // mutation url patterns that evict this entry
}
```

### Proposed initial table

| Endpoint | TTL | Scope | Invalidated by |
|---|---|---|---|
| `/v2/partner/category-available2` | 24h | shared | — |
| `/v2/partner/tags-available` | 24h | shared | — |
| `/v2/partner/top-per-category` | 1h | shared | — |
| `/v2/offer/hotpicks` | 15m | shared | — |
| `/v2/partner/{id}` | 1h | shared | — |
| `/v2/post/forum/categories` | 24h | shared | — |
| `/v2/post/marketplace/categories` | 24h | shared | — |
| `/v2/post/magazine/latest` | 15m | shared | — |

TTLs are a first proposal, not a finding — see the open question in `plan.md`.
Everything not listed is uncached; that is the opt-in default from
`research.md` R3.

### Explicitly excluded, with reasons

| Endpoint | Why not |
|---|---|
| `/v2/auth/me` | No parameters at all — identity is the Bearer token alone. Also feeds the forced-verification path at `useRequest.js:62-83`, where an hour-stale `expired` flag is a correctness bug, not just a stale read |
| `/v2/user/history` | User-scoped; needs E2 `scope: "user"` before it is safe |
| `/v2/post/latest/more?...last_post=<ts>` | Timestamp cursor — every URL is unique, hit rate is structurally zero |
| `/v2/post/search?...prev=<ts>` | As above |
| `/v2/post/old?last=<ts>` | As above |
| `/v2/post/comments` | Changes continuously; an hour-stale thread reads as broken |

---

## E4. `InvalidationMap` — mutations to evicted keys

Derived from E3 rather than stored separately: on a successful non-GET, every
policy whose `invalidatedBy` matches the mutation url has its rows deleted.

```
POST /v2/post/create  ->  evict /v2/post/forum/categories
                          evict /v2/post/marketplace/categories
```

**Validation**: eviction runs only after a mutation the server accepted. A failed
POST must not clear the cache — that would turn a server error into a
cache-thrash loop.

**Scope**: user-scoped entries are evicted only for the acting account.

---

## E5. State transitions

```
request(GET url)
   │
   ├─ not allowlisted ─────────────────────────────► network (unchanged)
   ├─ retry > 0 ───────────────────────────────────► network (never cached)
   │
   └─ allowlisted, retry 0
         │
         ├─ row present and fresh ──► return cached payload, no network
         ├─ row present but stale ──► delete row ──┐
         └─ no row ─────────────────────────────────┤
                                                    ▼
                                              network request
                                                    │
                                    ┌───────────────┴───────────────┐
                                 success                         failure
                                    │                               │
                       non-empty? write row                  no write, no delete
                                    │
                              return payload
```

A failed request leaves any existing row alone — the next attempt gets another
chance at the network, and nothing is destroyed on the way.

---

## E6. Lifecycle

| Event | Effect on `api_cache` |
|---|---|
| Successful allowlisted GET | Row inserted or replaced |
| Successful mutation | Matching rows deleted (E4) |
| Read of a stale row | That row deleted (existing `readCache` behaviour) |
| **Signout** | **Whole table cleared** — new, `research.md` R4 |
| App start | Sweep rows older than the longest TTL; trim to the row ceiling (R5) |
| Settings → clear cache | Whole table cleared (existing, `profSettings.js:234`) |

---

## Non-goals

- No stale-while-revalidate in this scope (see `plan.md` open question).
- No offline-first behaviour: an expired entry with no network is still a miss.
- No caching of POST/PUT/DELETE responses.
- No change to the `image_cache` half of the database.
