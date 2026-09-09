# Phase 0 Research: SQLite Caching for GET Requests

**Feature**: 011-api-get-cache | **Date**: 2026-09-08

Findings verified against the working tree at `1c71f5e`. Every claim below cites
the file it came from.

---

## R1. The cache layer already exists and is already proven

No new database is needed. `utils/cacheDb.js` opens a shared `cache.db` with a
memoised open promise, WAL journalling, and an `api_cache` table whose own
comment describes it as *"whole JSON payloads, keyed by request identity, with a
TTL."* `utils/apiCache.js` wraps it in `makeCacheKey` / `readCache` /
`writeCache` / `clearCache`, all best-effort and non-throwing.

Two screens already consume it — `location-list.screen.js:180` and, as of this
branch, `map.screen.js` — both with a one-hour TTL. The idiom is settled:

```
cacheKey -> readCache -> hit? apply and return : request -> writeCache -> apply
```

**Decision**: reuse both files unchanged where possible. This feature is about
*where* the idiom is applied, not about building storage.

---

## R2. The request surface

`hooks/useRequest.js` returns `httpRequest(url, method, body, header, signal,
token, retry)`. Across `src/` and `hooks/`:

| Method | Call sites |
|---|---|
| `post` | 29 |
| `get` | 28 |
| `put` | 7 |
| `delete` | 1 |

The 28 GETs resolve to ~21 distinct endpoints. They are **not** homogeneous, and
that is the central finding of this research.

---

## R3. "Cache every GET" is the wrong rule — three classes of endpoint

Sorting the 21 endpoints by what caching would actually do:

### 3a. Safe and worth caching (stable reference data)

```
/v2/partner/category-available2   /v2/partner/tags-available
/v2/partner/top-per-category      /v2/offer/hotpicks
/v2/post/forum/categories         /v2/post/marketplace/categories
/v2/post/magazine/latest          /v2/partner/{id}
```

Slow-moving, shared across users, and exactly what the existing hour TTL suits.

### 3b. Actively harmful to cache (user-scoped or correctness-critical)

```
/v2/auth/me          the caller's own profile — membership status, expiry
/v2/user/history     the caller's redemption history
```

`/v2/auth/me` takes **no parameters at all**. Its entire identity is the Bearer
token. Cached under the current key scheme, every user on the device shares one
row. See R4 — this is the finding that shapes the whole design.

Beyond the privacy problem, `useRequest.js:62-83` reads `user.userData.expired`
and `isAuthorized` to force re-verification. Serving that from an hour-old cache
means a card that expired 50 minutes ago still reads as valid.

### 3c. Pointless to cache (timestamp-cursor pagination)

```
/v2/post/latest/more?...&last_post=${moment...}
/v2/post/search?keyword=...&prev=${moment...}
/v2/post/comments?id=...&prev=...&mode=...
/v2/post/old?last=...
```

The cursor is a **timestamp generated at call time**, so every request produces a
URL that has never been seen before. Every read misses, every response writes a
row that will never be read again. The hit rate is structurally zero and the
only effect is unbounded table growth (R5).

**Decision**: an explicit allowlist, not a blanket rule. Caching is opt-in per
endpoint, defaulting to off.

**Alternative rejected**: blanket-with-a-denylist. It fails unsafely — a new
endpoint added later is cached by default, and the author has to know to opt out.
For 3b that default is a data leak. Opt-in fails safe.

---

## R4. Cache keys have no user dimension, and signout does not clear the cache

Two independent facts that combine into a real defect:

```js
// utils/apiCache.js
export const makeCacheKey = (endpoint, body) =>
  shorthash.unique(`${CACHE_VERSION}::${endpoint}::${JSON.stringify(body)}`);
```

No user, no token, no account. And `signout()` in
`src/services/auth_v2/auth.context.js:80-95` clears every SecureStore key and
resets auth state, but **never touches `cache.db`**. The only thing that clears
it is a manual tap in `profSettings.js:234`.

So: user A signs in, a user-scoped GET is cached, A signs out, B signs in on the
same device, B's screen reads A's row. That is a cross-account data leak, and
adding caching to `/v2/auth/me` or `/v2/user/history` creates it.

The two endpoints already using the cache (`location-list`, `map`) are *not*
user-scoped, which is why the defect is latent rather than live today.

**Decision**: two mitigations, both required.

1. Add the account id to the key for anything user-scoped, so rows cannot
   collide across users even if they survive.
2. Clear `api_cache` on signout, so a departing user's data does not linger on
   a shared device regardless of key shape.

Neither alone is sufficient: (1) leaves A's data on disk after A leaves, (2)
leaves a window where a token refresh swaps users without a signout.

---

## R5. `api_cache` has no size bound and no eviction

Rows are removed in exactly three places: `readCache` deletes a row it finds
stale, `clearCache` deletes one by key, and `clearAllCaches` truncates. Nothing
sweeps expired rows that are never read again.

Combined with R3c that is a growth problem: every scroll of the post feed writes
a row nobody will ever read, and nothing removes it. The image half of the cache
is size-reported and evictable; the API half is neither.

**Decision**: bound it. A startup sweep of rows older than the longest TTL, plus
a row-count ceiling. Cheap, and it stops a cache from becoming a disk leak.

---

## R6. Where the caching logic should live

Two options, and the request as phrased ("any GET from `useRequest` should have
cache") implies the first.

| | Inside `useRequest` | At the call site |
|---|---|---|
| Reach | all 28 GETs at once | one screen at a time |
| Opt-in per endpoint | needs a table `useRequest` consults | natural |
| Visible to the reader | no — caching becomes invisible | yes |
| Interacts with retry/401/refresh | **yes — see below** | no |
| Matches existing code | no | yes (2 screens) |

`httpRequest` is not a thin fetch wrapper. It performs token refresh and retry
(`useRequest.js:187-205`), forced re-verification on card expiry (`:62-83`),
signout on a foreign-device login (`:167-176`), and recursive self-calls with an
incremented retry counter. Wrapping cache reads around all of that means being
precise about which paths may return a cached value — a 401-then-refresh retry
must not be served from cache, and an aborted request must stay
distinguishable from an empty response (`:104-108`).

**Decision**: put it in `useRequest`, but as a **narrow gate at the top of the
function and a single write on the success path only** — never inside the retry
recursion. The allowlist from R3 is consulted there. Call sites stay unchanged.

**Alternative rejected**: a separate `useCachedRequest` hook. It leaves two
request paths to keep in sync and does not satisfy the request as phrased.

---

## R7. Mutations do not invalidate anything

29 POSTs, 7 PUTs and 1 DELETE currently have no relationship to the cache. A
`post` that creates a forum entry leaves `/v2/post/forum/categories` and the
feed's cached pages untouched, so the user's own write can be invisible to them
for up to an hour.

The two existing consumers dodge this because partner coordinates and locations
are not user-writable.

**Decision**: pair each cached endpoint in the allowlist with the mutation paths
that invalidate it, and evict on a successful mutation. Without this, caching a
user-writable resource is a bug rather than an optimisation.

---

## R8. Testing reality

Jest here covers pure logic only — no component harness, no device tests. But
unlike features 009 and 010, **most of this feature is testable**: key
generation, allowlist matching, TTL expiry, invalidation mapping and the sweep
are all pure functions over inputs.

**Decision**: this is the first feature in this repo where real unit tests are
both possible and warranted. The cross-user isolation rule in R4 in particular
should have a test, because it is a privacy property and it will not be caught
by looking at a screen.

Repo gates that must stay green: `npm test`, `lint`, `check:styles`,
`check:screen-props`, `check:animation`, `audit:lists`.

---

## Summary of decisions

| # | Decision | Confidence |
|---|---|---|
| R1 | Reuse `cacheDb.js` / `apiCache.js`; build no new storage | High |
| R3 | Explicit allowlist, opt-in per endpoint — not every GET | High; **contradicts the request as phrased** |
| R4 | Account-scoped keys **and** clear-on-signout | High — both files read |
| R5 | Bound the table: startup sweep + row ceiling | High |
| R6 | Gate inside `useRequest`, outside the retry recursion | High |
| R7 | Mutation-driven invalidation map | High |
| R8 | Unit tests, including a cross-user isolation test | High |
