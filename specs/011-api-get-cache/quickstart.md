# Quickstart: Validating the GET Request Cache

**Feature**: 011-api-get-cache | **Phase 1**

Unlike 009 and 010, the core of this feature is verifiable without a device. Run
Gate 1 first — if the unit tests do not hold, nothing below matters.

---

## Prerequisites

- No native rebuild required. This is JS-only; a reload is enough.
- Two test accounts, for Gate 4.
- A way to throttle or disable the network, for Gate 3.

---

## Gate 0 — mechanical

```bash
npm test
npm run lint
npm run check:styles
npm run check:screen-props
npm run check:animation
npm run audit:lists
```

---

## Gate 1 — the policy table (unit tests)

```bash
npm test -- cachePolicy
```

| # | Assertion |
|---|---|
| 1.1 | An endpoint absent from `CACHE_POLICIES` returns `null` from `policyFor` |
| 1.2 | `policyFor(allowlistedUrl, "post")` returns `null` — GET only |
| 1.3 | A row older than its TTL reads as a miss and is deleted |
| 1.4 | **Two account ids produce different keys for the same url** |
| 1.5 | No policy in the shipped table declares `scope: "user"` before Phase D |
| 1.6 | A successful mutation evicts exactly its declared policies; a failed one evicts nothing |

1.4 is the privacy property from `research.md` R4. It cannot be observed on a
screen — if it regresses, only this test will say so.

---

## Gate 2 — cache hits actually happen

With a `__DEV__` log naming each hit and miss:

| # | Step | Expected |
|---|---|---|
| 2.1 | Cold start, open Home | All four Home requests log a miss, then a write |
| 2.2 | Navigate away and back | Allowlisted endpoints log a hit; **no network request** in the debugger |
| 2.3 | Open a partner detail twice | Second open is a hit |
| 2.4 | Scroll the post feed | Every page logs *no* cache activity — these are excluded by design |
| 2.5 | Wait past the shortest TTL, revisit | Miss, refetch, rewrite |

2.4 is the check that the timestamp-cursor exclusion held. If those endpoints
start caching, the table is growing with rows nobody will read.

---

## Gate 3 — the cache never breaks a request

| # | Step | Expected |
|---|---|---|
| 3.1 | Corrupt a row's `value` to invalid JSON, reload | Treated as a miss, refetched — no crash |
| 3.2 | Delete `cache.db` while running, reload | Reopens; requests still succeed |
| 3.3 | Airplane mode on a cached screen | Cached data renders; expired entries still miss and fail normally |
| 3.4 | Pull-to-refresh on Home | Reaches the network, not the cache |

---

## Gate 4 — cross-account isolation ⚠️

**The most important manual gate. Do not skip it.**

| # | Step | Expected |
|---|---|---|
| 4.1 | Sign in as user A, browse enough to populate the cache | Rows written |
| 4.2 | Sign out | `api_cache` is **empty** — verify by row count, not by looking at a screen |
| 4.3 | Sign in as user B on the same device | No screen shows any of A's data |
| 4.4 | Repeat with a forced token refresh mid-session | Still isolated |

Before this feature, step 4.2 fails: `signout()` in `auth.context.js:80-95`
clears SecureStore and auth state but never touches `cache.db`. Phase A is what
makes 4.2 pass.

---

## Gate 5 — the table stays bounded

| # | Step | Expected |
|---|---|---|
| 5.1 | Note the `api_cache` row count via `getCacheSize()` | Baseline |
| 5.2 | Scroll the post feed heavily, force-quit, reopen | Count does not grow without limit; the startup sweep has removed expired rows |
| 5.3 | Settings → clear cache | Count returns to 0 and the reported size updates |

---

## Rollback

Phases A–D are independent commits and revert cleanly. JS-only, so an OTA update
can carry both the change and its revert — unlike features 010 and 011's native
neighbours.

**Do not revert Phase A alongside the others.** It fixes the signout leak and the
unbounded growth, and both are defects that exist independently of whether GET
caching ships.
