# Feature Specification: SQLite Caching for GET Requests

**Feature Branch**: `011-api-get-cache`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "any fetch GET request that retrieve data from `const request = useRequest();` should have cache in the expo sql"

> **Note on provenance**: this spec was written *after* `plan.md`, to formalise the user stories that
> `/speckit-tasks` requires — the same order `005`, `009` and `010` used. It restates the plan's
> phases as testable slices and introduces no new scope. `plan.md`, `research.md`, `data-model.md`
> and `contracts/cache-policy.md` remain the authority on mechanism.

## Summary

Route GET responses through the SQLite cache that already exists in this repo
(`utils/cacheDb.js`, `utils/apiCache.js`), applied centrally in `hooks/useRequest.js` so that no
call site changes.

### Scope correction

The request says **any** GET should be cached. Research found that rule unsafe as stated, and this
spec narrows it deliberately:

- **`/v2/auth/me` and `/v2/user/history` are excluded.** `makeCacheKey` has no user dimension, and
  `signout()` never clears `cache.db`. `/v2/auth/me` takes no parameters at all — its identity is
  the Bearer token alone — so caching it under today's key scheme serves user A's profile to user B
  after a device handover. `/v2/auth/me` additionally feeds the forced re-verification path at
  `useRequest.js:62-83`, where an hour-stale `expired` flag is a correctness bug, not a stale read.
- **Four timestamp-cursor endpoints are excluded.** The post feed and search paginate on a cursor
  generated at call time, so every URL is one never seen before: the hit rate is structurally zero
  and every response writes a row nothing will ever read.

Caching is therefore **opt-in per endpoint via an allowlist**, defaulting to off. A denylist was
rejected: it fails unsafely, because a newly added endpoint is cached by default and the author must
know to opt out — which for a user-scoped endpoint is a cross-account leak.

If the two excluded user-scoped endpoints are wanted, US5 makes them safe. It is specified here and
left at P3 rather than dropped.

### What this feature does not claim

**It is not offline-first.** An expired entry with no network is still a miss and still fails.

**It does not cache mutations.** POST, PUT and DELETE responses are never stored.

**It does not add a database.** `api_cache` already exists with the right shape; no migration is
required for US1–US4.

### Evidence supplied

| Finding | Location | Verified against |
|---|---|---|
| Cache layer already exists and is proven | `research.md` R1 | `utils/cacheDb.js`, `utils/apiCache.js`; consumers at `location-list.screen.js:180` and `map.screen.js` |
| 28 GET call sites, ~21 endpoints | `research.md` R2 | grep over `src/` and `hooks/` |
| Cache keys carry no user dimension | `research.md` R4 | `utils/apiCache.js` — `makeCacheKey(endpoint, body)` |
| `signout()` never clears the cache | `research.md` R4 | `src/services/auth_v2/auth.context.js:80-95` |
| `/v2/auth/me` takes no parameters | `research.md` R3b | call site survey |
| Post feed paginates on a timestamp cursor | `research.md` R3c | `last_post=${moment...}`, `prev=${moment...}` |
| `api_cache` has no eviction or size bound | `research.md` R5 | only `readCache`, `clearCache`, `clearAllCaches` delete rows |
| `httpRequest` self-recurses on retry | `research.md` R6 | `useRequest.js:118-130, 152-161, 199-205` |
| Mutations invalidate nothing today | `research.md` R7 | 29 POST / 7 PUT / 1 DELETE, no cache interaction |

## User Scenarios & Testing

### User Story 1 — Signing out leaves nothing behind (Priority: P1)

Two colleagues share a demo device. The first signs out; the second signs in. The second sees none
of the first's data.

Today `signout()` (`auth.context.js:80-95`) clears every SecureStore key and resets auth state but
never touches `cache.db`. The only thing that empties it is a manual tap in Settings
(`profSettings.js:234`). The defect is currently latent because the only two cached endpoints are
not user-scoped — this feature is what would make it live.

**Why P1**: it is a privacy defect that exists today, it is small, and every later story widens what
sits in that cache. It must land first.

**Independent test**: sign in as A, browse, sign out, and assert `api_cache` has zero rows — by row
count, not by looking at a screen. Then sign in as B and confirm no screen shows A's data.

### User Story 2 — Revisited screens load without waiting for the network (Priority: P1)

A member opens Home, navigates into a partner, and comes back. The Home sections render immediately
from disk instead of re-fetching four endpoints.

**Why P1**: this is the feature as requested, and the user-visible payoff.

**Independent test**: cold-start and open Home (all requests miss, then write). Navigate away and
back — allowlisted endpoints log a hit and **no network request appears in the debugger**. Scroll
the post feed and confirm *no* cache activity: those endpoints are excluded by design.

### User Story 3 — A member's own writes are visible immediately (Priority: P2)

A member creates a forum post and returns to the list. Their post is there.

29 POSTs, 7 PUTs and 1 DELETE currently have no relationship to the cache, so a cached list would go
on serving the pre-write version for up to an hour.

**Why P2**: it depends on US2 existing. But it is not optional — an allowlisted endpoint that the
user can write to is a bug until this lands, which is why no writable resource may be added to the
allowlist before US3.

**Independent test**: with a writable resource allowlisted, perform a mutation and confirm the
matching entries are evicted and the next read refetches. Then force a mutation to fail and confirm
nothing is evicted.

### User Story 4 — The cache cannot grow without bound (Priority: P2)

A heavy user's app does not accumulate cache rows forever.

Rows are deleted in only three places today: a stale row on read, a single key, or the whole table.
Nothing sweeps expired rows that are never read again — and the excluded timestamp-cursor endpoints
would have written one dead row per scroll.

**Why P2**: a cache that only grows is a disk leak. Not urgent at today's volume, which is why it
sits below the privacy fix.

**Independent test**: record the row count, scroll heavily, force-quit and reopen; the count does not
grow without limit and the startup sweep has removed expired rows.

### User Story 5 — User-scoped endpoints can be cached safely (Priority: P3)

`/v2/auth/me` and `/v2/user/history` become cacheable without any risk of one account reading
another's row.

Requires the account id in the cache key (`data-model.md` E2), so two accounts on one device produce
two rows that cannot collide.

**Why P3**: optional. It exists so the excluded endpoints from the Summary have a route in rather
than being permanently written off. `/v2/auth/me` may still be judged too correctness-critical to
cache at any TTL even once keys are scoped — that is a separate decision.

**Independent test**: two account ids produce different keys for the same URL. Assert it in a unit
test; it cannot be observed on a screen.

## Requirements

### Functional

- **FR-001**: GET responses MUST be cached only for endpoints present in an explicit allowlist.
- **FR-002**: A request with `retry > 0` MUST NOT be served from cache.
- **FR-003**: Only successful, non-empty responses MUST be written; error payloads, aborts and timeouts MUST NOT be.
- **FR-004**: Non-GET methods MUST never be served from or written to the cache.
- **FR-005**: `signout()` MUST clear `api_cache` in full.
- **FR-006**: A successful mutation MUST evict the entries its policy declares; a failed one MUST evict nothing.
- **FR-007**: A cache failure of any kind MUST degrade to a miss, never to a request failure.
- **FR-008**: Aborted requests MUST remain distinguishable from empty responses (`useRequest.js:104-108`).
- **FR-009**: All 28 existing GET call sites MUST keep their current signatures.
- **FR-010**: A user-scoped policy with no available account id MUST result in no caching, not a placeholder key.

### Non-functional

- **NFR-001**: No endpoint whose response drives the expiry/verification path at `useRequest.js:62-83` may be allowlisted.
- **NFR-002**: `api_cache` MUST have a bounded row count and a startup sweep of expired rows.
- **NFR-003**: All repo gates stay green: `npm test`, `lint`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`.
- **NFR-004**: The feature MUST be shippable over OTA — no native change.

### Testing

Unlike features 009 and 010, the core of this one is unit-testable without a device
(`research.md` R8). **Tests are explicitly in scope**, and at minimum must cover: allowlist
matching, GET-only enforcement, TTL expiry, invalidation mapping, and cross-account key isolation.

The isolation test is required, not optional: it guards a privacy property that no amount of
looking at a screen will catch.

## Success Criteria

- **SC-001**: After signout, `api_cache` contains zero rows.
- **SC-002**: A revisited Home screen renders allowlisted sections with no network request.
- **SC-003**: The post feed and search produce no cache rows at all.
- **SC-004**: A member's own write is visible on the next read of an affected list.
- **SC-005**: Cache row count stays bounded across heavy use and restarts.
- **SC-006**: Two account ids never share a cache row for the same URL.
- **SC-007**: Corrupting or deleting the cache database does not break any request.

## Out of Scope

- Offline-first behaviour or serving stale data on network failure.
- Stale-while-revalidate (the contract allows adding it later).
- Caching POST/PUT/DELETE responses.
- Changes to the `image_cache` half of the database.
- Folding the two existing hand-rolled call-site caches into the central gate — optional cleanup.
