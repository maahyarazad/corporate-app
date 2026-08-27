# Quickstart: Validating the List Refactor

Two gates: a reproducible inventory script, and a device sweep. Six instances additionally get
before/after profiling — and only those six may be described as performance improvements.

## Prerequisites

- Physical iOS and Android device (dev-client build; Expo Go is not sufficient)
- `npm install` clean
- React DevTools profiler available (`npx react-devtools`)
- The `002-reanimated-migration` branch merged or checked out as the base — instance 2 touches a
  file that branch changed

## Baseline (BEFORE any edit)

```bash
git checkout 003-flatlist-optimization   # branched from 002
npm run audit:lists    # expect: 27 instances, 11 missing keyExtractor, 12 inline renderItem, 0 getItemLayout
npm test               # expect 27/27, matching the 002 baseline
npm run check:animation  # expect pass — 002's gate must not regress
```

**Profile the eight Perf instances and keep the traces.** Without a before, no performance claim in
this refactor is falsifiable:

| # | Instance | What to capture |
|---|---|---|
| 3 | `offerList` | Render count on expand/collapse; frames during the 300ms animation |
| 14 | `NationalityInput` | Commits per keystroke while filtering ~250 countries |
| 15 | `PhoneInput` | Commits per keystroke while filtering ~250 countries |
| 16 | `locationlist` (paginated) | Commits per scroll page; JS FPS while flinging |
| 19 | `posts.screen` (main feed) | **Network panel**: how many `loadNextPage` calls on first render (defect D2) |
| 20 | `postSearch` | Commits per keystroke while results are on screen |
| 26 | `slideshow` | Frames while swiping the carousel |
| 27 | `category.component` | Home-screen time-to-interactive |

Record numbers, not impressions.

## Automated gate

`scripts/audit-lists.js` + `npm run audit:lists`. It parses each list's opening JSX tag,
**strips comments first**, and fails on any C5 violation.

Expected end state:

```
27 instances
missing keyExtractor:      0
inline renderItem:         0
FlatList without data:     0
onEndReachedThreshold > 1: 0
```

Run after every phase. `npm test` and `npm run check:animation` must also stay green.
(`npm run lint` is still broken for unrelated reasons — see `002`'s `follow-ups.md` F3. Not a gate.)

## Sweep — manual validation

### Phase B — Category A (the two non-lists)

| # | Scenario | Expected |
|---|---|---|
| A1 | Open the Specials screen | Renders identically; scrolls normally; no layout shift |
| A2 | Open a location detail, scroll past offset 270, scroll back | **The `002` sticky header still slides in and clamps.** This is the regression risk — the `Animated.ScrollView` must still drive `scrollHandler` |
| A3 | Pull-to-refresh on location detail | `RefreshControl` still fires |
| A4 | Fling the location detail hard | Header tracks with no lag |

### Phase C — Correctness

| # | Scenario | Expected |
|---|---|---|
| C1 | Main feed: cold open, watch the network panel | `loadNextPage` fires **once**, not repeatedly (defect D2) |
| C2 | Main feed: scroll to the bottom | Next page loads once per page boundary |
| C3 | Any list that filters or reorders (search, notifications) | Rows keep their own images and press targets — no cross-contamination from index keys (defect D3) |
| C4 | Location cards carousel | Restored `keyExtractor` (defect D1); swiping is stable |

### Phase D — Identity fixes

| # | Scenario | Expected |
|---|---|---|
| D1 | Open a screen with a memoized row, trigger unrelated parent state (open/close a modal) | Profiler shows rows **not** re-rendering. If they still do, the `onPress` closure was missed — contract C1 |
| D2 | Every changed row's press target | Still navigates/selects the correct item. The `onPress(item)` signature change is the risk here |
| D3 | Lists with `getItemLayout` added | Scrolling is not misaligned; nothing jumps. Wrong values are worse than none — contract C4 |

### Phase E — `.map()` conversions

| # | Scenario | Expected |
|---|---|---|
| E1 | Offer list: expand a partner with >10 offers | All rows appear at once — no pop-in during the 300ms animation |
| E2 | Offer list: expand then collapse | Height animates both ways; `showAll` flips only after collapse completes (the `002` `runOnJS` guard) |
| E3 | Profile settings, marketplace post detail | No "VirtualizedLists should never be nested" warning in the console |
| E4 | A partner with an unusually large offer count | Still performs acceptably — this is the boundedness assumption from `research.md` R4 being tested |

## Regression checklist

- [ ] `npm run audit:lists` clean; `npm test` 27/27; `npm run check:animation` passing
- [ ] All sweep scenarios pass on **both** iOS and Android
- [ ] **Release build tested** — memo and identity bugs often only show under release timing
- [ ] The eight Perf instances re-profiled and compared against the Phase A traces
- [ ] No new console warnings about keys, nested VirtualizedLists, or `keyExtractor`
- [ ] The 19 non-Perf instances described as correctness/hygiene in the PR, **not** as speedups
- [ ] `002`'s location-view header verified end to end (A2–A4)

## Rollback

Commits are grouped by category and per file within a category, so any single instance reverts with
`git revert <sha>`. No phase depends on a later phase. Phase B is the only one touching `002`'s
work — if the header regresses, revert Phase B alone and the rest stands.
