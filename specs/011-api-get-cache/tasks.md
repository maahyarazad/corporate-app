---
description: "Task list for SQLite caching of GET requests"
---

# Tasks: SQLite Caching for GET Requests

**Input**: Design documents from `/specs/011-api-get-cache/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/cache-policy.md`, `quickstart.md`

**Tests**: **Included, and explicitly in scope** — see `spec.md` "Testing". This is the first feature
in this repo where the core is unit-testable without a device (`research.md` R8): allowlist
matching, TTL expiry, key scoping and invalidation are pure functions. The cross-account isolation
test is required rather than optional: it guards a privacy property no screen inspection will catch.

**Organization**: Grouped by user story. US1 ships independently and fixes a defect that exists today.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US5

## Path Conventions

React Native / Expo. The cache layer lives in `utils/` at the repository **root**, not under `src/` —
`utils/cacheDb.js`, `utils/apiCache.js`, tests in `utils/__tests__/`. `src/` holds screens and
services. JS-only: everything here ships over OTA.

---

## Phase 1: Setup

- [X] T001 Confirm all repo gates are green before starting: `npm test`, `npm run lint`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists`
- [ ] T002 [P] Record the current `api_cache` row count and reported size via `getCacheSize()` in `utils/cacheDb.js`, as the baseline for the US4 growth check
  - ⚠️ **BLOCKED — needs a running app.** Not captured; re-measure against `master` if the growth baseline is still wanted.
- [X] T003 [P] Add a `__DEV__`-only debug log helper in `utils/apiCache.js` that names each cache hit, miss and write — Gates 2 and 3 in `quickstart.md` depend on being able to see cache activity

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The cache-version bump, which every later story's keys depend on.

**⚠️ Must complete before US2.** Changing the key shape after entries exist would leave unreadable
rows behind.

- [X] T004 Bump `CACHE_VERSION` from `"v1"` to `"v2"` in `utils/apiCache.js`. Adding the scope segment in T022 changes every hash; the version bump makes that invalidation deliberate rather than a silent orphaning of the rows `location-list.screen.js` and `map.screen.js` have already written (`data-model.md` E2)

**Checkpoint**: key shape settled; user stories can begin.

---

## Phase 3: User Story 1 — Signing out leaves nothing behind (Priority: P1) 🎯 MVP

**Goal**: A departing user's cached data does not survive on the device.

**Independent Test**: Sign in as A, browse, sign out, assert `api_cache` has zero rows by row count.
Sign in as B and confirm no screen shows A's data.

### Tests for User Story 1

- [X] T005 [P] [US1] Write a failing test in `utils/__tests__/cacheDb.test.js` asserting a helper that clears only `api_cache` empties that table and leaves `image_cache` rows intact

### Implementation for User Story 1

- [X] T006 [US1] Add `clearApiCache()` to `utils/cacheDb.js` — deletes every `api_cache` row without touching `image_cache` or the image files on disk. Distinct from `clearAllCaches`, which also deletes the image bytes and would make signout needlessly expensive
- [X] T007 [US1] Call `clearApiCache()` from `signout()` in `src/services/auth_v2/auth.context.js:80-95`, alongside the existing SecureStore deletions. Must not throw: a cache failure cannot be allowed to block a signout (FR-007)
- [ ] T008 [US1] Verify against `quickstart.md` Gate 4 on a device with two accounts — the cross-account handover check
  - ⚠️ **BLOCKED — needs two accounts on a device.** `clearApiCache()` is unit-tested and wired into `signout()`, but the handover itself is unverified.

**Checkpoint**: the latent privacy defect is fixed and shippable on its own, with no caching behaviour added yet.

---

## Phase 4: User Story 2 — Revisited screens load without waiting for the network (Priority: P1)

**Goal**: Allowlisted GETs are served from SQLite on revisit, with no call-site changes.

**Independent Test**: Cold-start Home (misses, then writes). Navigate away and back — allowlisted
endpoints hit and no network request appears. Scroll the post feed and confirm no cache activity.

### Tests for User Story 2

- [X] T009 [P] [US2] Write failing tests in `utils/__tests__/cachePolicy.test.js` for `policyFor`: an endpoint absent from the table returns null; an allowlisted path with method "post" returns null (GET-only, FR-004); each of the 8 allowlisted endpoints in `data-model.md` E3 resolves to a policy
- [X] T010 [P] [US2] Write a failing test asserting none of the six excluded endpoints in `data-model.md` E3 matches any policy — the two user-scoped and four timestamp-cursor ones
- [X] T011 [P] [US2] Write a failing test asserting no shipped policy declares `scope: "user"` before US5 lands (`contracts/cache-policy.md` Part 1, rule 4)
- [X] T012 [P] [US2] Write a failing test for TTL: a row written past its policy's `ttlMs` reads as a miss and is deleted

### Implementation for User Story 2

- [X] T013 [US2] Create `utils/cachePolicy.js` exporting `CACHE_POLICIES`, `policyFor(url, method)` and `invalidationsFor(url, method)` per `contracts/cache-policy.md` Part 1. Opt-in only: unlisted endpoints return null
- [X] T014 [US2] Populate `CACHE_POLICIES` with the 8 allowlisted endpoints and their TTLs from `data-model.md` E3. Leave `invalidatedBy` empty for now — US3 fills it. Do NOT add any writable resource until US3 lands
- [X] T015 [US2] Add the read gate at the top of `httpRequest` in `hooks/useRequest.js`, before the options object is built. Entered only when method is `get`, `policyFor` is non-null, **and `retry === 0`**. The retry condition is load-bearing: `httpRequest` self-recurses with `++retry` at lines 118-130, 152-161 and 199-205, and a retry exists precisely because the caller needs the network (`contracts/cache-policy.md` Part 2)
- [X] T016 [US2] Add the write on the success path in `hooks/useRequest.js`, immediately after `axios.request` resolves and before `Promise.resolve(response.data)`. Only when the read gate's conditions were met and the payload is non-empty. Fire-and-forget, not awaited
- [X] T017 [US2] Confirm nothing is written on the failure paths in `hooks/useRequest.js`: the `default:` branch returning `error.response.data` at line ~220, the abort rethrow at 104-108, the `ECONNABORTED` timeout branch, and every 401/403/500 path (FR-003, FR-008)
- [ ] T018 [US2] Verify against `quickstart.md` Gate 2 and Gate 3 — hits actually occur, excluded endpoints produce none, and a corrupted or deleted `cache.db` degrades to a miss rather than a crash
  - ⚠️ **BLOCKED — needs a device.** Gate 2/3 of `quickstart.md`.

**Checkpoint**: the requested feature works for the 8 safe endpoints. Nothing writable is cached yet.

---

## Phase 5: User Story 3 — A member's own writes are visible immediately (Priority: P2)

**Goal**: A successful mutation evicts the cached reads it invalidates.

**Independent Test**: With a writable resource allowlisted, mutate and confirm the matching entries
are evicted and the next read refetches. Force a mutation to fail and confirm nothing is evicted.

### Tests for User Story 3

- [X] T019 [P] [US3] Write failing tests in `utils/__tests__/cachePolicy.test.js` for `invalidationsFor`: a mutation url returns exactly its declared policies, and an unrelated mutation returns none
- [X] T020 [P] [US3] Write a failing test asserting a rejected mutation evicts nothing (`data-model.md` E4) — a server error must not become a cache-thrash loop

### Implementation for User Story 3

- [X] T021 [US3] Populate `invalidatedBy` on the relevant policies in `utils/cachePolicy.js` and add eviction to `hooks/useRequest.js` on the success path for non-GET methods only, using `invalidationsFor`. Runs only after the server accepted the mutation
- [ ] T022 [US3] Verify against `quickstart.md` Gate 2, exercising a create-then-read round trip on an allowlisted writable resource
  - ⚠️ **BLOCKED — needs a device.** Invalidation is unit-tested; the create-then-read round trip is not.

**Checkpoint**: writable resources can now be safely allowlisted.

---

## Phase 6: User Story 4 — The cache cannot grow without bound (Priority: P2)

**Goal**: `api_cache` has a ceiling and expired rows are swept.

**Independent Test**: Record the row count, scroll heavily, force-quit and reopen; the count does not
grow without limit.

### Tests for User Story 4

- [X] T023 [P] [US4] Write a failing test in `utils/__tests__/cacheDb.test.js` asserting the sweep deletes rows older than the longest TTL and leaves fresher rows alone
- [X] T024 [P] [US4] Write a failing test asserting the row ceiling evicts oldest-first once exceeded

### Implementation for User Story 4

- [X] T025 [US4] Add `sweepApiCache()` to `utils/cacheDb.js` — deletes rows whose `saved_at` is older than the longest TTL in `CACHE_POLICIES`, then trims to a row ceiling oldest-first. Uses the existing `idx_api_cache_saved_at` index, which currently serves nothing (`data-model.md` E1)
- [X] T026 [US4] Call `sweepApiCache()` once at app start from `App.js`, after `initMapbox()`-style module-scope setup. Best-effort and never awaited on the render path
- [ ] T027 [US4] Verify against `quickstart.md` Gate 5 — row count bounded across heavy use and restarts, and Settings → clear cache still reports correctly
  - ⚠️ **BLOCKED — needs a device.** Sweep is unit-tested; growth across restarts is not.

**Checkpoint**: the cache is bounded. US1–US4 together are the complete feature as scoped.

---

## Phase 7: User Story 5 — User-scoped endpoints can be cached safely (Priority: P3)

**Goal**: Account-scoped keys, so `/v2/auth/me` and `/v2/user/history` become cacheable without
cross-account collision.

**Independent Test**: Two account ids produce different keys for the same URL — a unit test, since
it cannot be observed on a screen.

### Tests for User Story 5

- [X] T028 [P] [US5] Write a failing test in `utils/__tests__/cachePolicy.test.js` asserting `makeCacheKey` with two different account ids produces two different keys for an identical url and body (SC-006, `research.md` R4)
- [X] T029 [P] [US5] Write a failing test asserting a user-scoped policy with no account id available produces no cache write at all, rather than a placeholder key (FR-010)

### Implementation for User Story 5

- [X] T030 [US5] Add the optional fourth `scope` segment to `makeCacheKey` in `utils/apiCache.js` per `data-model.md` E2 — `"shared"` for shared entries, the account id for user-scoped ones
- [X] T031 [US5] Thread the account id from `useUser()` into the cache gate in `hooks/useRequest.js`, skipping the cache entirely when a user-scoped policy has no id available
- [X] T032 [US5] Add `/v2/user/history` to `CACHE_POLICIES` in `utils/cachePolicy.js` with `scope: "user"`, and remove the US2-era assertion that no policy is user-scoped (T011)
- [ ] T033 [US5] Decide whether `/v2/auth/me` is cacheable at any TTL. Scoped keys remove the cross-account risk but not the staleness risk: it drives the forced re-verification path at `useRequest.js:62-83`, where an hour-old `expired` flag means an expired card still reads as valid. **Recommendation: leave it uncached** (NFR-001). Product decision, not a code change
  - ⚠️ **OPEN — product decision.** Implemented as recommended: `/v2/auth/me` stays uncached, asserted by a test. Confirm or overrule.

**Checkpoint**: all stories complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T034 [P] Re-run every repo gate: `npm test`, `npm run lint`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists` (NFR-003)
- [X] T035 [P] Export both platform bundles to confirm no resolution errors: `npx expo export --platform ios` and `--platform android`
- [ ] T036 Run `quickstart.md` end to end — all six gates, with Gate 4 (cross-account) on a real device with two accounts
  - ⚠️ **BLOCKED — needs a device with two accounts.**
- [ ] T037 [P] Resolve the open TTL question in `plan.md`: the table in `data-model.md` E3 proposes 24h for reference data, 1h for partner detail, 15m for hotpicks and magazine. Confirm or adjust with product
  - ⚠️ **OPEN — product decision.** TTLs shipped as proposed: 24h reference data, 1h partner, 15m hotpicks/magazine/history.
- [ ] T038 Consider folding the two hand-rolled call-site caches into the central gate — `location-list.screen.js:180` and the partner-coordinates fetch in `map.screen.js`. Optional cleanup, explicitly out of scope in `spec.md`; leaving them is correct and harmless
  - ⚠️ **NOT DONE — deliberately.** Optional cleanup, out of scope per `spec.md`. The two hand-rolled call-site caches still work; folding them in would change two screens for no behavioural gain.
- [X] T039 [P] Confirm the feature ships over OTA with no native change (NFR-004) — no new native module was added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T002 must run before US4's implementation, or the growth baseline is lost
- **Foundational (Phase 2)**: T004 blocks US2 and US5 — the key shape must settle before entries are written under it
- **US1 (Phase 3)**: depends only on Setup. **Independently shippable**; fixes a defect that exists today
- **US2 (Phase 4)**: depends on Foundational. Should land after US1 — US1 is P1, smaller, and widening what sits in the cache before the signout leak is fixed makes that leak worse
- **US3 (Phase 5)**: depends on US2
- **US4 (Phase 6)**: depends on Setup and on `CACHE_POLICIES` existing (T013) for the longest-TTL value
- **US5 (Phase 7)**: depends on US2. Optional
- **Polish (Phase 8)**: depends on all shipped stories

### Story Dependency Graph

```text
Setup ──→ US1 (P1) ────────────────────────────────→ shippable alone
    │
    └──→ T004 ──→ US2 (P1) ──┬──→ US3 (P2)
                             ├──→ US4 (P2)   (also needs T013)
                             └──→ US5 (P3, optional)
```

### Within US2

T009–T012 (tests) are parallel with each other and all precede T013.
T013 → T014 (module before its data).
T015 → T016 → T017 all edit `hooks/useRequest.js` and must be sequential.

### Parallel Opportunities

- **T002, T003** run alongside T001
- **All test tasks within a story** — T009–T012, T019–T020, T023–T024, T028–T029 — are parallel: separate assertions, and they must fail before their implementation lands
- **US3 and US4 can proceed in parallel** once US2 is done: US3 touches `cachePolicy.js` + the mutation path, US4 touches `cacheDb.js` + `App.js`
- **T034, T035, T037, T039** are parallel in Polish
- **Nothing inside T015–T017 is parallel** — one file, sequential edits

## Implementation Strategy

### MVP scope

**US1 alone (T001–T008).** Eight tasks, two files, no caching behaviour added. It closes the signout
leak that exists in the code today and is a prerequisite for everything else being safe. Ship it
before any caching widens what the leak exposes.

### Incremental delivery

1. **US1** → signout clears the cache. Release.
2. **US2** → the 8 safe endpoints cache. This is the requested feature, and the visible speed win.
3. **US3 + US4** → writes invalidate, and the table stays bounded. Can be worked in parallel.
4. **US5** → optional, only if the user-scoped endpoints are wanted.

Steps 2–4 are naturally one release: US2 without US4 means an unbounded table, and US2 without US3
means no writable resource can be allowlisted.

### Rollback

Every story is a self-contained revert, and the whole feature is JS-only — **an OTA update can carry
both the change and its revert**, unlike features 010 and its native neighbours.

Do not revert US1 alongside the others: the signout leak and the unbounded table are defects that
exist independently of whether GET caching ships.
