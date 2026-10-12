# Implementation Plan: SQLite Caching for GET Requests

**Branch**: `011-api-get-cache` (not yet created — branch from `010-expo-maps`)
**Date**: 2026-09-08
**Input**: "any fetch GET request that retrieve data from `const request = useRequest();` should have cache in the expo sql"
**Spec**: ⚠️ not yet written — see "Process note"

## Process note

No `spec.md` exists for 011. On 010 the same gap made `/speckit-tasks` hard-fail
(`setup-tasks.sh` requires it) and the spec had to be backfilled mid-flow.
Running `/speckit-specify` for 011 before `/speckit-tasks` avoids repeating that.
The research below stands either way.

## Summary

Route GET responses through the SQLite cache that already exists
(`utils/cacheDb.js`, `utils/apiCache.js`), applied centrally in
`hooks/useRequest.js` so call sites do not change.

**One scope correction, and it matters.** The request says *any* GET should be
cached. Research says that rule is unsafe as stated, for two of the 21 GET
endpoints:

- `/v2/auth/me` takes **no parameters** — its whole identity is the Bearer
  token. `makeCacheKey` has no user dimension (`utils/apiCache.js`), and
  `signout()` never clears `cache.db` (`auth.context.js:80-95`). Cache it under
  today's key scheme and user A's profile is served to user B after a device
  handover. Same for `/v2/user/history`.
- Four post/search endpoints paginate on a **timestamp cursor generated at call
  time**, so every request is a URL never seen before: zero hit rate, one dead
  row written per scroll, nothing to remove it (`api_cache` has no eviction).

So the plan delivers caching for every GET where it is correct and useful, via an
explicit allowlist, and states plainly which endpoints are excluded and why. That
is the full ask minus the part that would leak data between accounts. If you want
the excluded two cached as well, R4's account-scoped keys make it possible — say
so and they move into scope.

## Technical Context

**Platform**: React Native 0.81.5, Expo SDK 54, Hermes, New Architecture
**Storage**: `expo-sqlite@16.0.10`, already configured (`app.json` — SQLCipher on iOS, off on Android)
**Existing layer**: `utils/cacheDb.js` (shared handle, WAL, memoised open), `utils/apiCache.js` (`makeCacheKey`/`readCache`/`writeCache`/`clearCache`)
**Existing consumers**: `location-list.screen.js:180`, `map.screen.js` — both 1h TTL
**Integration point**: `hooks/useRequest.js` — 234 lines, handles token refresh, retry, expiry, forced signout
**Surface**: 28 GET call sites / ~21 endpoints; 29 POST, 7 PUT, 1 DELETE
**Testing**: Jest, 27 tests, pure logic. Unlike 009/010 **most of this feature is unit-testable** — see `research.md` R8
**Repo gates**: `npm test`, `lint`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`

**NEEDS CLARIFICATION — non-blocking**: per-endpoint TTLs. The plan starts every
allowlisted endpoint at the 1h already used by the two live consumers. Reference
data (`/v2/post/forum/categories`) could reasonably sit at 24h and hotpicks at
15m. Tunable in one table without touching logic.

**NEEDS CLARIFICATION — non-blocking**: whether a stale-while-revalidate mode is
wanted (serve the cached row instantly, refresh in the background). It changes
perceived speed a lot and the contract is designed to allow it later, but it is
not in this scope.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

**Status: cannot be evaluated** — `.specify/memory/constitution.md` is still the
unmodified template, every principle a `[PRINCIPLE_N_NAME]` placeholder. Recorded
as unevaluable rather than passing, as on 010. The plan is held to the repo's
mechanical gates plus observable house conventions:

| Convention | Source | Applied here |
|---|---|---|
| Caches are best-effort, never throw | `apiCache.js`, `cacheDb.js` comments | Every new path swallows its own errors; a cache fault must never fail a request |
| Cache miss is the safe default | `readCache` returns `null` on any failure | Allowlist is opt-in; unknown endpoints are uncached |
| No inline style literals | `check:styles` | No UI in this feature |
| Screens take no `navigation` prop | `check:screen-props` | No screen signature changes |

**Post-Phase-1 re-check**: unchanged. The design adds no new violation; it
removes a latent one (R4).

## Project Structure

### Documentation (this feature)

```text
specs/011-api-get-cache/
├── plan.md                  # This file
├── research.md              # Phase 0 — 8 findings
├── data-model.md            # Phase 1 — entities, key shape, TTL/invalidation tables
├── quickstart.md            # Phase 1 — validation runbook
├── contracts/
│   └── cache-policy.md      # Phase 1 — the allowlist contract and useRequest gate
├── spec.md                  # MISSING — see Process note
└── tasks.md                 # Phase 2 — /speckit-tasks
```

### Source Code (repository root)

```text
utils/
├── cacheDb.js               # MODIFY  — startup sweep + row ceiling (research.md R5)
├── apiCache.js              # MODIFY  — optional account scope in makeCacheKey (R4)
└── cachePolicy.js           # NEW     — the allowlist: endpoint -> {ttl, scope, invalidatedBy}

hooks/
└── useRequest.js            # MODIFY  — read gate before dispatch, write on success only

src/services/auth_v2/
└── auth.context.js          # MODIFY  — clear api_cache on signout (R4)

utils/__tests__/
└── cachePolicy.test.js      # NEW     — matching, TTL, cross-user isolation, invalidation
```

**Structure Decision**: the policy table is a separate module rather than a
constant inside `useRequest.js`. `useRequest` is already 234 lines carrying token
refresh, retry recursion and three different forced-signout paths; the endpoint
table is data, is the thing most likely to change, and is the thing worth unit
testing in isolation.

## Design in brief

**Read gate** at the top of `httpRequest`, before dispatch, entered only when:
method is `get`, the endpoint matches the allowlist, and `retry === 0`. That last
condition keeps the cache entirely outside the retry/401-refresh recursion
(`useRequest.js:187-205`) — a retry must reach the network by definition.

**Write** on the success path only, after `axios.request` resolves, and only for
a non-empty payload. Errors, aborts and `error.response.data` fallbacks are never
cached.

**Key** = `version :: endpoint :: body :: scope`, where scope is the account id
for user-scoped entries and a constant for shared ones (`data-model.md` E2).

**Invalidation** is table-driven: each allowlisted endpoint declares the mutation
paths that dirty it, and a successful non-GET evicts them (`research.md` R7).

## Phased approach

| Phase | Content | Independently shippable? |
|---|---|---|
| **A** | Clear `api_cache` on signout; startup sweep + row ceiling | **Yes** — fixes the latent leak and the growth problem with no behaviour change |
| **B** | `cachePolicy.js` + the `useRequest` read/write gate, allowlist limited to the 8 safe endpoints | Yes |
| **C** | Mutation-driven invalidation | Yes, but B is incomplete without it for any user-writable resource |
| **D** | Optional: account-scoped keys, unlocking `/v2/auth/me` and `/v2/user/history` | Only if those two are wanted |

Phase A is worth landing regardless of whether the rest proceeds: it fixes a
defect that exists today.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cross-account data served after a device handover | **Critical** | Phase A clears on signout; Phase D adds account-scoped keys. Both, not either |
| Stale membership/expiry state driving `useRequest`'s forced-verification path | **High** | `/v2/auth/me` excluded from the allowlist |
| Caching hidden inside `useRequest` makes staleness hard to diagnose | Medium | Allowlist is one readable table; a debug log behind `__DEV__` names every hit |
| A user's own write invisible for an hour | Medium | Phase C invalidation; do not allowlist a writable resource before C lands |
| `api_cache` grows without bound | Medium | Phase A sweep + ceiling |
| Cache read adds latency to a miss | Low | SQLite read on WAL is sub-millisecond; miss path is unchanged otherwise |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New `utils/cachePolicy.js` | Endpoint policy is data, changes often, and is the unit-testable core | A constant inside `useRequest.js` adds a 5th concern to a file already juggling refresh, retry and three signout paths |
| Allowlist instead of caching every GET | Two endpoints leak across accounts; four have a structurally zero hit rate | A denylist fails unsafely — a new endpoint is cached by default and the author must know to opt out |
