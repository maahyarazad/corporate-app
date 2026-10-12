# Contract: `utils/cachePolicy.js` and the `useRequest` cache gate

**Feature**: 011-api-get-cache | **Phase 1**

Two surfaces: the policy table (data) and the gate inside `httpRequest`
(behaviour). Both are described here because neither is meaningful alone.

---

## Part 1 — `utils/cachePolicy.js`

### Exports

```
policyFor(url, method) -> CachePolicy | null
invalidationsFor(url, method) -> CachePolicy[]
CACHE_POLICIES -> CachePolicy[]      // exported for the test suite
```

`policyFor` returns `null` for anything not allowlisted, which is every endpoint
by default. `invalidationsFor` returns the policies a successful mutation should
evict.

### Rules

1. **Opt-in only.** An endpoint absent from `CACHE_POLICIES` is never cached.
   A denylist was rejected: a newly added endpoint would be cached by default and
   the author would have to know to opt out — which for a user-scoped endpoint is
   a cross-account leak (`research.md` R3, R4).
2. **GET only.** `policyFor` returns `null` for any other method, regardless of
   the table.
3. **Matching is on the path, ignoring volatile query parameters** where the
   policy says so. `lang` and `app_id` belong in the key; a timestamp cursor
   means the endpoint should not be in the table at all.
4. **No policy may declare `scope: "user"` until account-scoped keys land**
   (Phase D). Until then a `"user"` entry is a defect, and the test suite asserts
   the table contains none.

---

## Part 2 — the gate in `hooks/useRequest.js`

### Read, before dispatch

Entered only when **all** hold:

| Condition | Why |
|---|---|
| `method === "get"` | Nothing else is cacheable |
| `policyFor(url, method)` is non-null | Opt-in allowlist |
| `retry === 0` | **The load-bearing one.** `httpRequest` calls itself with `++retry` for timeouts, connection failures and post-refresh 401s (`useRequest.js:118-130, 152-161, 199-205`). A retry exists because the caller needs the network; serving it from cache would make the retry a no-op and could loop |

On a hit the cached payload is returned directly. Token refresh, expiry checks
and the retry ladder are all skipped — which is the point, and is also why the
allowlist must never contain an endpoint that feeds those paths
(`data-model.md` E3).

### Write, on success only

After `axios.request` resolves, and only when:

- the read gate's conditions were met, **and**
- the payload is non-empty.

Never written: `error.response.data` returned by the `default:` branch
(`useRequest.js:220`), aborts (`:104-108`), timeouts, or any 4xx/5xx path. Those
are error shapes, and caching one pins a failure for the TTL.

The write is **fire-and-forget** — `writeCache` never throws and is not awaited.
A request must not wait on bookkeeping, and a cache fault must not fail it.

### Invalidation, after a successful mutation

A non-GET that resolves triggers eviction of every policy matching
`invalidationsFor(url, method)`. A rejected mutation evicts nothing
(`data-model.md` E4).

---

### Corrections found during implementation (2026-09-08)

**1. Eviction cannot address a policy by key.** The contract assumed a mutation
could evict via `clearCache(key)`. It cannot: one policy matches many urls —
every partner id, every `lang` — and `makeCacheKey` returns an opaque hash that
cannot be searched. `makeCacheKey` now takes a `policyId` and keeps it as a
readable key **prefix**, and `clearCacheByPolicy(id)` deletes on that prefix. No
schema change was needed, so `data-model.md` E1 still holds.

**2. The read gate sits after the expiry check, not at the top of the
function.** Placing it first would let a user with an expired card go a full TTL
without reaching the forced re-verification path at `useRequest.js:62-83`. That
check is a cheap boolean in the normal case, so running it before the cache read
costs nothing and preserves the behaviour.

**3. `jest.config.js` `testMatch` only collected `src/**`.** The cache layer
lives in `utils/` at the repository root, so its tests would never have run. The
pattern now covers both roots.

## Behavioural contract

1. **A cache fault is a miss, never an error.** Every path swallows its own
   failures, matching `apiCache.js` and `cacheDb.js` as they stand.
2. **Aborts stay distinguishable from empty responses.** `useRequest.js:104-108`
   rethrows `CanceledError` ahead of everything else; the gate must not swallow
   or pre-empt that.
3. **Cache reads never mutate auth state.** A hit returns before the expiry
   check at `:62-83`, so no allowlisted endpoint may be one whose response drives
   that check.
4. **No caching without an identity when scope demands one.** If a policy is
   user-scoped and no account id is available, the request is uncached rather
   than cached under a placeholder.
5. **Call sites do not change.** All 28 GET sites keep their current signature.
   The two screens already caching by hand (`location-list.screen.js:180`,
   `map.screen.js`) keep working; folding them into the central gate is optional
   cleanup, not a requirement.

---

## What this contract deliberately does not do

- **It does not cache every GET**, despite the feature request. Six endpoints are
  excluded: two would leak across accounts, four have a structurally zero hit
  rate. Both sets are enumerated with reasons in `data-model.md` E3.
- **It does not serve stale data on a network failure.** Offline-first is a
  different feature with different failure modes.

---

## Verification

Unlike features 009 and 010, most of this is unit-testable without a device:
`policyFor` matching, TTL expiry, key-scope isolation, invalidation mapping, and
the sweep are pure functions.

`utils/__tests__/cachePolicy.test.js` must cover at minimum:

- an endpoint absent from the table is not cached;
- a non-GET is never cached, even for an allowlisted path;
- an expired row is a miss and is deleted;
- **two account ids produce two different keys for the same url** — the
  cross-account isolation property from `research.md` R4, which no amount of
  looking at a screen will catch;
- a successful mutation evicts exactly its declared policies, and a failed one
  evicts nothing.
