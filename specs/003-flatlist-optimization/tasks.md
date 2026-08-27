---
description: "Task list for the FlatList audit and optimization"
---

# Tasks: FlatList Audit & Optimization

**Input**: Design documents from `/specs/003-flatlist-optimization/`

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/list-api.md`, `quickstart.md`

**Tests**: No automated test tasks. Per `research.md` R6, list behaviour is not assertable in this
repo's Jest setup (no RN testing-library, `jest-expo` unconfigured). Verification is
`npm run audit:lists` plus the device sweep and profiler traces in `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which work stream (US1–US6)
- Exact file paths in every task

## Note on "user stories"

No `spec.md` exists — this is a mechanical audit (see `plan.md` §Branch Note). The six stories
below are the categories from `data-model.md`. Each is independently shippable with its own sweep
scenarios. Priorities reflect value-to-risk, not user value.

**Instance numbers** (e.g. "instance 19") refer to the inventory table in `data-model.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Branch correctly and establish a baseline that makes later claims falsifiable

- [X] T001 Create branch `003-flatlist-optimization` from `002-reanimated-migration` (NOT `master` — instance 2 touches `src/screens/location/location-view.screen.js`, which `002` changed). Leave the uncommitted `app.json` version bump to 3.3.2/build 72 alone; it is unrelated to this work
- [X] T002 Record the `npm test` (27/27) and `npm run check:animation` (passing) baselines in `specs/003-flatlist-optimization/quickstart.md`, so a pre-existing failure is never attributed to this refactor
- [ ] T003 Capture React DevTools profiler traces on a physical device for the **eight** Perf instances listed in `specs/003-flatlist-optimization/quickstart.md` §Baseline (instances 3, 14, 15, 16, 19, 20, 26, 27). **Blocking for US3/US5** — without a before, no performance claim is verifiable. Record numbers, not impressions
- [ ] T004 For instance 19, capture the **network panel** on a cold open of the main feed in `src/screens/posts/posts.screen.js`, counting `loadNextPage` calls. This is the evidence for defect D2

**Checkpoint**: Baseline captured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A reproducible inventory. 27 instances across 24 files cannot be re-verified by hand.

**⚠️ CRITICAL**: T005 blocks the verification tasks in every later phase

- [X] T005 Create `scripts/audit-lists.js` — parse each list's opening JSX tag across `src/`, report which props are present, and exit non-zero on any `contracts/list-api.md` §C5 violation (no `FlatList` without `data`; no missing `keyExtractor`; no inline `renderItem`; no `onEndReachedThreshold > 1`). **It MUST strip line comments and JSX block comments before matching** — the first audit run wrongly reported `keyExtractor` present on `locationcards.js` and `scrollEnabled={false}` on `posts.screen.js` because both are commented out (`research.md` R6)
- [X] T006 Register `audit:lists` in `package.json` pointing at `scripts/audit-lists.js`, and verify it **fails** against the current tree with exactly: 27 instances, **9** missing `keyExtractor`, 12 inline `renderItem`, 2 `FlatList` without `data`, 1 `onEndReachedThreshold > 1`, 0 `getItemLayout`. (9, not the 11 quoted in `data-model.md`: the script counts the two no-`data` instances under their own violation instead of double-counting them as missing keys. 9 + 2 = 11.)

**Checkpoint**: Inventory reproducible and failing as expected

---

## Phase 3: US1 — Delete the two non-lists (Priority: P1) 🎯 MVP

**Goal**: Two instances have neither `data` nor `renderItem` — they build a VirtualizedList inside a ScrollView to render one footer. Highest value-to-risk ratio in the plan.

**Independent test**: Sweep scenarios A1–A4. Both screens render and scroll identically, and the `002` sticky header still slides in, clamps, and survives pull-to-refresh.

- [X] T007 [P] [US1] Replace `<FlatList ListFooterComponent={renderSpecials} />` at `src/screens/specials.screen.js:103` with a `ScrollView` rendering `renderSpecials()` as its child. No `data`, no `renderItem` — this was never a list
- [X] T008 [US1] Replace the `<Animated.FlatList>` at `src/screens/location/location-view.screen.js:395` with `Animated.ScrollView` from `react-native-reanimated`. **Must preserve** `onScroll={scrollHandler}`, `scrollEventThrottle={16}`, the `RefreshControl`, and `ListFooterComponent={renderPartner}` becoming a plain child. This is `002`'s sticky-header scroll driver — `research.md` R3
- [ ] T009 [US1] Run sweep scenarios A1–A4 from `specs/003-flatlist-optimization/quickstart.md` on both platforms, **including `002`'s header scenarios C1–C3**, then commit

**Checkpoint**: Two VirtualizedLists removed outright

---

## Phase 4: US2 — Correctness defects (Priority: P1)

**Goal**: Wrong keys and a broken pagination threshold. These are defects, not optimizations, and ship before any perf work.

**Independent test**: Sweep scenarios C1–C4. `loadNextPage` fires once per page boundary; filtering and reordering lists keep row state attached to the right item.

- [ ] T010 [US2] Fix defect D2: change `onEndReachedThreshold={5}` to `0.5` at `src/screens/posts/posts.screen.js:521`. The unit is multiples of visible list length, so `5` fires pagination immediately and repeatedly. Match the sibling `postSearch.screen.js:249`, which uses `0.5` (`research.md` R7)
- [ ] T011 [US2] Verify T010 in `src/screens/posts/posts.screen.js` with the network panel against the T004 baseline: `loadNextPage` must fire **once** on cold open, not per frame
- [ ] T012 [P] [US2] Fix defect D1: restore the commented-out `keyExtractor` at `src/components/locationcards.js:248` and wrap it in `useCallback`
- [ ] T013 [P] [US2] Add a `useCallback`-stable `keyExtractor` to `src/features/home/components/toppartners.component.js:40` per `contracts/list-api.md` §C3
- [ ] T014 [P] [US2] Add `keyExtractor` to `src/features/locations/components/locationlist.component.js:164` (the horizontal, non-scrolling inner list). Also confirm whether `horizontal` + `scrollEnabled={false}` together is intended, and record the answer
- [ ] T015 [P] [US2] Add `keyExtractor` to both lists in `src/screens/posts/post_card/postCard.component.js` (lines 531 and 537)
- [ ] T016 [P] [US2] Add `keyExtractor` to `src/components/events/eventList.js:361` and hoist its inline style into a `StyleSheet`
- [ ] T017 [P] [US2] Add `keyExtractor` to `src/features/profile/profSettings.js:438` and hoist its inline style
- [ ] T018 [P] [US2] Add `keyExtractor` to `src/screens/notifications.screen.js:270` and hoist its inline style
- [ ] T019 [US2] For any list in T012–T018 whose data has no stable domain id, **do not fall back to the index** — record it in `specs/003-flatlist-optimization/follow-ups.md` as a data problem to raise (`contracts/list-api.md` §C3)
- [ ] T020 [US2] Run sweep scenarios C1–C4 from `specs/003-flatlist-optimization/quickstart.md` on both platforms, then commit

**Checkpoint**: `npm run audit:lists` reports 0 missing `keyExtractor`, 0 threshold violations

---

## Phase 5: US3 — Identity fixes on the Perf instances (Priority: P2)

**Goal**: Stable `renderItem` and genuinely-effective `React.memo` on the eight instances where it can plausibly be measured.

**⚠️ `React.memo` is inert while the parent mints a closure per item.** Every task here that adds `React.memo` MUST also change that row's `onPress` signature to `(item) => void` per `contracts/list-api.md` §C1, **in the same commit**, and update every caller of that row.

**Independent test**: Sweep scenarios D1–D2 with the profiler. Rows do not re-render on unrelated parent state, and every press target still resolves to the correct item.

- [ ] T021 [US3] In `src/features/offers/components/offer.component.js`, wrap `Offer` in `React.memo` and change its `onPress` contract to `(offer) => void`, calling `onPress(offer)` from its own `TouchableHighlight` handler. Update the caller in `src/components/offerList.js` in the same commit
- [ ] T022 [P] [US3] Memoize `renderItem` with `useCallback` and stabilise `keyExtractor` in `src/components/NationalityInput.js:297` (instance 14 — filters ~250 countries per keystroke)
- [ ] T023 [P] [US3] Same treatment for `src/components/PhoneInput.js:352` (instance 15). Wrap the row in `React.memo` with the `(item) => void` contract
- [ ] T024 [P] [US3] In `src/features/locations/components/locationlist.component.js:299` (paginated), hoist the inline style into a `StyleSheet` and wrap the row component in `React.memo` with the `(item) => void` contract
- [ ] T025 [P] [US3] In `src/screens/posts/posts.screen.js:477`, wrap the inline `keyExtractor={(item) => item?.post_id?.toString()}` in `useCallback` and hoist the `style={[styles.container, { backgroundColor: "#eee" }]}` array into a `StyleSheet` entry
- [ ] T026 [P] [US3] In `src/screens/posts/postSearch.screen.js:242`, hoist the inline style and wrap the row in `React.memo` with the `(item) => void` contract
- [ ] T027 [P] [US3] In `src/components/slideshow.js:134`, hoist the inline style and stabilise `renderItem`
- [ ] T028 [P] [US3] In `src/features/home/components/category.component.js:131`, memoize `renderItem`, hoist the inline style, and wrap the row in `React.memo` with the `(item) => void` contract (home screen, affects first paint)
- [ ] T029 [US3] Re-profile all eight Perf instances listed in `specs/003-flatlist-optimization/quickstart.md` against the T003 baseline. **If a row still re-renders on unrelated parent state, the `onPress` closure was missed** — go back to §C1 rather than declaring success
- [ ] T030 [US3] Run sweep scenarios D1–D2 from `specs/003-flatlist-optimization/quickstart.md` on both platforms, then commit

---

## Phase 6: US4 — Hygiene identity fixes (Priority: P2)

**Goal**: The remaining nine instances where stable identities are simply the right thing to do. **No measurable win is expected — do not describe these as speedups.**

**Independent test**: Screens render identically; `npm run audit:lists` reports 0 inline `renderItem`.

- [ ] T031 [P] [US4] Memoize `renderItem` and hoist the inline style in `src/components/suggestion.js:16`
- [ ] T032 [P] [US4] Hoist the inline style in `src/features/home/components/specialtags.js:123`
- [ ] T033 [P] [US4] Memoize `renderItem` and hoist the inline style in `src/screens/posts/post_entry/forms/postEntryMobil.component.js:829`
- [ ] T034 [P] [US4] Memoize the derived `data` expression in `src/screens/posts/postDetailMarketplace.screen.js:210` with `useMemo` so it does not rebuild every render
- [ ] T035 [P] [US4] Memoize `renderItem` in `src/components/DropDown.js:259`
- [ ] T036 [P] [US4] Hoist the inline style in `src/screens/soleil.screen.js:82`
- [ ] T037 [P] [US4] Memoize `renderItem` and hoist inline styles in **both** lists in `src/screens/posts/post_entry/postEntryCategorySelect.screen.js` (lines 60 and 95)
- [ ] T038 [P] [US4] Hoist the inline style in `src/components/mediaUploader.js/mediaUploader.component.js:417`
- [ ] T039 [US4] Run `npm run audit:lists`; confirm 0 inline `renderItem` remain, then commit

---

## Phase 7: US5 — `getItemLayout` where height is fixed (Priority: P3)

**Goal**: The codebase has **zero** uses of `getItemLayout`. Add it only where the row size is genuinely fixed.

**⚠️ Wrong values are worse than none** — they misalign scrolling and break `scrollToIndex`. Read the row's `StyleSheet` and include the separator; do not guess (`contracts/list-api.md` §C4).

**Independent test**: Sweep scenario D3. Scrolling is not misaligned and nothing jumps.

- [ ] T040 [P] [US5] Add `getItemLayout` to `src/components/events/eventList.js:361` after confirming the row height from its `StyleSheet` and adding the separator height
- [ ] T041 [P] [US5] Add `getItemLayout` to `src/components/NationalityInput.js:297` and `src/components/PhoneInput.js:352` — country rows are uniform height
- [ ] T042 [P] [US5] Add `getItemLayout` to `src/components/slideshow.js:134` and `src/features/home/components/category.component.js:131` using the **fixed item width** (these are horizontal lists, so `length` is width)
- [ ] T043 [US5] Audit every candidate row for text that can wrap to a second line. **Skip `getItemLayout` for any variable-height row** and record the skip in `specs/003-flatlist-optimization/follow-ups.md`
- [ ] T044 [US5] Run sweep scenario D3 from `specs/003-flatlist-optimization/quickstart.md` on both platforms, then commit

---

## Phase 8: US6 — `.map()` conversions (Priority: P3) ⚠️ LARGEST STRUCTURAL CHANGE

**Goal**: Nine instances set `scrollEnabled={false}`. Where the item count is provably bounded, `FlatList` is pure overhead. Sequenced last because it is the biggest change and the least certain benefit.

**⚠️ The boundedness assumption must be verified against the API, not a local fixture** (`research.md` R4). Where the maximum is unknown or large, keep `FlatList` and set `initialNumToRender={data.length}` instead.

**Independent test**: Sweep scenarios E1–E4, including a partner with an unusually large offer count.

- [ ] T045 [US6] Confirm the realistic maximum item count for each `scrollEnabled={false}` instance against the API. Record each answer in `specs/003-flatlist-optimization/follow-ups.md`. **This gates every task below** — convert only where the bound is known
- [ ] T046 [US6] Convert `src/components/offerList.js:127` to `.map()` inside a `View`. Use `item.id` as the React key. **Correct the row-height constant while here**: `OFFER_COMPONENT_HEIGHT` is `120`, but a real row is `110` (`ticketContainer` in `offer.component.js`) + `6` (`itemSeparatorVS`) = **116**, so the animated container is ~4px per row too tall (`data-model.md` §Worked example)
- [ ] T047 [US6] Verify the `002` expand/collapse behaviour still holds in `src/components/offerList.js`: height animates 300ms both ways and `showAll` flips only **after** the collapse completes via the `runOnJS` guard (`contracts/list-api.md` §C2)
- [ ] T048 [US6] Fix the stale `shortOfferList` in `src/components/offerList.js`: it is set in a `useEffect(..., [])` so it never updates if the `offers` prop changes without a remount. Add `[offers, minItems]` to the dependency array
- [ ] T049 [P] [US6] Convert the nested list in `src/features/profile/profSettings.js:438` to `.map()`, resolving the "VirtualizedLists should never be nested inside plain ScrollViews" warning (`data-model.md` §Nesting)
- [ ] T050 [P] [US6] Convert the nested list in `src/screens/posts/postDetailMarketplace.screen.js:210` to `.map()`, same warning
- [ ] T051 [P] [US6] For each remaining `scrollEnabled={false}` instance where T045 found the bound **unknown or large**, keep `FlatList` and set `initialNumToRender={data.length}` instead of converting — files: `src/components/suggestion.js`, `src/features/home/components/specialtags.js`, `src/features/home/components/toppartners.component.js`, `src/screens/posts/post_card/postCard.component.js`, `src/screens/posts/post_entry/forms/postEntryMobil.component.js`
- [ ] T052 [US6] Run sweep scenarios E1–E4 from `specs/003-flatlist-optimization/quickstart.md` on both platforms **against a release build**, then commit

**Checkpoint**: No nested-VirtualizedList warnings remain

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T053 Run `npm run audit:lists` — must exit `0` with 0 missing `keyExtractor`, 0 inline `renderItem`, 0 `FlatList` without `data`, 0 `onEndReachedThreshold > 1`
- [ ] T054 Run `npm test` (must be no worse than the T002 baseline of 27/27) and `npm run check:animation` (must still pass — `002`'s gate must not regress)
- [ ] T055 Complete the full regression checklist in `specs/003-flatlist-optimization/quickstart.md`, including the release-build pass
- [ ] T056 Re-profile all eight Perf instances and record before/after numbers in `specs/003-flatlist-optimization/follow-ups.md`
- [ ] T057 Write the PR description so the **19 non-Perf instances are described as correctness and hygiene, not as performance improvements** (`plan.md` Constitution Check, conditional gate)
- [ ] T058 [P] Record the FlashList decision as a follow-up in `specs/003-flatlist-optimization/follow-ups.md`: reconsider for the three paginated lists (`posts.screen`, `postSearch.screen`, `locationlist.component`) only after profiling shows `FlatList` is the bottleneck (`research.md` R5)

---

## Dependencies

```
Phase 1 (T001-T004) ──> Phase 2 (T005-T006)
                            │
                            ├──> US1 (T007-T009)   🎯 MVP
                            ├──> US2 (T010-T020)
                            ├──> US3 (T021-T030)   [needs T003 baseline]
                            ├──> US4 (T031-T039)
                            ├──> US5 (T040-T044)
                            └──> US6 (T045-T052)   ⚠️ do last
                                     │
                                     v
                            Phase 9 (T053-T058)
```

**Hard dependencies**:
- T003 (profiler baseline) blocks T029 and T056
- T004 (network baseline) blocks T011
- T005/T006 (audit script) block T039, T053
- T045 (boundedness check) gates T046–T051
- T010 blocks T011; T021 blocks T046 (same component pair); T046 blocks T047 and T048 (same file)
- Phase 9 requires all story phases complete

**Soft ordering**: US1–US5 are mutually independent. US6 is sequenced last by design — it is the
largest structural change and rests on a data assumption that T045 must confirm.

**File collisions — never parallel**:
- T016 and T040 (both `eventList.js`)
- T022/T023 and T041 (both `NationalityInput.js` / `PhoneInput.js`)
- T027/T028 and T042 (both `slideshow.js` / `category.component.js`)
- T034 and T050 (both `postDetailMarketplace.screen.js`)
- T017 and T049 (both `profSettings.js`)
- T025 and T010 (both `posts.screen.js`)

## Parallel execution examples

**Within US2** — independent files:
```
T012, T013, T014, T015, T016, T017, T018   # all [P]
```

**Within US4** — nine independent files:
```
T031, T032, T033, T034, T035, T036, T037, T038   # all [P]
```

**Across stories** — after Phase 2, three developers:
```
Dev A: US1 (T007-T009)  →  US5 (T040-T044)
Dev B: US2 (T010-T020)
Dev C: US3 (T021-T030)  →  US4 (T031-T039)
All:   regroup for US6 (T045-T052) — largest change, worth reviewing together
```

Mind the file-collision list above when splitting US5 out from US3/US4.

## Implementation strategy

**MVP scope**: Phase 1 + Phase 2 + US1 (T001–T009). Delivers the reproducible audit and removes
two entire VirtualizedLists that render no list at all — the clearest win in the survey, in nine
tasks.

**Incremental delivery**: Every task is one file (or one tightly-coupled pair) and one commit, so
any single change reverts with `git revert <sha>`. No phase depends on a later phase; the work can
stop after any checkpoint and ship as-is.

**Honesty gate**: 8 of 27 instances are plausibly measurable. The other 19 are correctness and
hygiene. T057 exists specifically to keep that distinction in the PR description — resist the pull
to describe a 27-file diff as a performance release.

**Risk concentration**: T008 (touches `002`'s sticky header) and T045–T052 (rests on a data
assumption). Budget review time there; the other 40-odd tasks are mechanical.
