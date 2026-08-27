# Implementation Plan: FlatList Audit & Optimization

**Branch**: `003-flatlist-optimization` (not yet created — see *Branch Note*) | **Date**: 2026-08-27
**Input**: "go through the source code and refactor all the FlatList" — generalising the
`offerList.js` review to every list in the app.

## Branch Note

`setup-plan.sh` resolves to `001-event-push-deeplink` regardless of the checked-out branch, so
this plan was written to a new directory, `specs/003-flatlist-optimization/`, rather than
overwriting another feature's artifacts.

**This work depends on `002-reanimated-migration`.** One target file,
`src/screens/location/location-view.screen.js`, was changed there — its `Animated.FlatList` is
now the scroll driver for the Reanimated sticky header. Branch from `002`, not `master`:

```bash
git checkout 002-reanimated-migration && git checkout -b 003-flatlist-optimization
```

There is no `spec.md`. This is a mechanical audit with an enumerable scope; the survey below is
the requirement set. Note also that `app.json` currently carries an uncommitted version bump to
`3.3.2` / build `72` — unrelated to this work, left untouched.

## Summary

A scripted audit of every list in `src/` found **27 list instances across 24 files**. The problems
are not evenly distributed, and the fix is not one pattern applied 27 times — the instances fall
into four groups with genuinely different correct answers, including two where the right move is
to delete the `FlatList` entirely.

Headline findings:

| Finding | Count |
|---|---|
| List instances total | 27 |
| Missing `keyExtractor` | 11 |
| Inline `renderItem` (new identity every render) | 12 |
| `getItemLayout` anywhere in the codebase | **0** |
| Inline `style` / `contentContainerStyle` object literals | 19 |
| `scrollEnabled={false}` (non-scrolling) | 9 |
| Horizontal carousels | 5 |
| Paginated (`onEndReached`) | 3 |
| **`FlatList` with no `data` and no `renderItem`** | **2** |

Two instances are a `FlatList` used purely as a scroll container — `<FlatList
ListFooterComponent={renderSpecials} />`. That builds an entire VirtualizedList + ScrollView to
render one footer. Those become `ScrollView`.

One genuine bug surfaced: `posts.screen.js:521` sets `onEndReachedThreshold={5}`. That unit is
*multiples of visible list length*, so the pagination callback fires when the user is within five
screens of the end — effectively immediately, and repeatedly. Typical values are `0.1`–`0.5`.

## Technical Context

**Language/Version**: JavaScript (ES2021), React 19.1.0, React Native 0.81.5, Expo SDK 54

**Architecture**: New Architecture / Fabric enabled (`newArchEnabled=true` on Android; iOS
`Podfile.lock` carries the `React-Fabric` pods). Relevant because Fabric changes cell-mounting
cost characteristics and makes `React.memo` on row components more valuable, not less.

**Relevant libraries**: `react-native-reanimated@4.1.7` (`Animated.FlatList` in location-view),
`react-native-reanimated-carousel@4.0.3` (already handles its own virtualization — out of scope).
`@shopify/flash-list` is **not** installed.

**Testing**: Jest via `npm test`; one suite (`src/utils/__tests__/pushDestination.test.js`), pure
logic. No RN testing-library, no component tests. List behaviour is verified by hand — see
`quickstart.md`.

**Constraints**:
- Zero visual change. Rows must render identically; only identity, keys, and mount scheduling move.
- No new dependencies. FlashList is deliberately not adopted (see `research.md` R5).
- `React.memo` on a row component is inert unless the `onPress` closure is also fixed. Applying
  one without the other is wasted work and creates the illusion of an optimization.

**Scale**: 27 instances, 24 files. 8 warrant real work; the rest are one- or two-line fixes.

## Constitution Check

`.specify/memory/constitution.md` is still an unpopulated template (`[PRINCIPLE_N_NAME]`
placeholders). No ratified gates exist, so this section passes vacuously. Self-imposed gates:

| Gate | Status |
|---|---|
| No visual or behavioural change except listed defect fixes | PASS — deviations in `data-model.md` §Defects |
| No new dependencies | PASS — FlashList explicitly rejected, R5 |
| Each instance independently revertable | PASS — grouped commits by category, never one mega-commit |
| Measured, not assumed | **CONDITIONAL** — see below |

**The conditional gate is the important one.** This is a performance refactor with no profiling
baseline. Most of these lists are short enough that the optimizations are *hygiene* (correct keys,
stable identities) rather than measurable wins. The plan is honest about which is which:
`data-model.md` marks every instance as either **Correctness**, **Hygiene**, or **Perf**, and only
the six **Perf** instances get before/after measurement in `quickstart.md`. Do not claim a
performance improvement for the other 21.

## Survey Summary

Full per-instance table in **[data-model.md](./data-model.md)**. By category:

| # | Category | Count | Correct answer |
|---|---|---|---|
| A | `FlatList` as scroll container (no data/renderItem) | 2 | Replace with `ScrollView` / `Animated.ScrollView` |
| B | Non-scrolling short lists (`scrollEnabled={false}`) | 9 | `.map()` where n is bounded; else minimal prop fixes |
| C | Real scrolling lists (incl. 3 paginated) | 11 | Full treatment: stable `keyExtractor`, memoized `renderItem`, `React.memo` rows, `getItemLayout` where height is fixed |
| D | Horizontal carousels | 5 | Stable identities; `getItemLayout` where width is fixed |

## Phased Approach

**Phase A — Foundation** (T-00…T-03): capture a profiling baseline on device for the eight Perf
instances; add a shared `useStableRenderItem` helper only if it proves to earn its place; add the
audit script to the repo so the inventory is reproducible.

**Phase B — Category A** (2 instances): delete the two `FlatList`-as-ScrollView uses. Highest
value-to-risk ratio in the whole plan — removes two VirtualizedLists outright. Touches
`location-view.screen.js`, so it must be verified against the `002` header animation.

**Phase C — Correctness** (11 missing `keyExtractor` + the `onEndReachedThreshold` bug): these are
defects, not optimizations. They ship first among the prop changes.

**Phase D — Category C/D identity fixes**: memoized `renderItem`, `React.memo` rows, hoisted
styles, stable `onPress`. Sequenced per file so each is revertable.

**Phase E — Category B**: `.map()` conversions where item counts are bounded. Deliberately last —
it is the largest structural change and the least certain benefit.

**Phase F — Verification**: re-run the audit script, confirm counts, device sweep, re-measure the
eight Perf instances against the Phase A baseline.

Task breakdown belongs in `tasks.md` — run `/speckit-tasks` next.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Two `FlatList` → `ScrollView` rewrites | They render no list at all; the virtualization machinery is pure overhead | Adding props to them would optimize a component that should not exist |
| `.map()` conversions in Category B | A non-scrolling, clipped list of 3–20 items pays for VirtualizedList + ScrollView for nothing | Keeping `FlatList` and tuning `initialNumToRender` treats the symptom; but this is applied only where n is provably bounded |
| Audit script committed to `scripts/` | 27 instances across 24 files cannot be re-verified by hand after each phase | A one-off analysis would leave the counts unfalsifiable at review time |

## Progress

- [x] Phase 0: Research → `research.md`
- [x] Phase 1: Design → `data-model.md`, `contracts/`, `quickstart.md`
- [x] Constitution check (vacuous — template unpopulated; self-imposed gates recorded)
- [ ] Phase 2: Tasks (`/speckit-tasks`)
- [ ] Phase 3: Implementation (`/speckit-implement`)
