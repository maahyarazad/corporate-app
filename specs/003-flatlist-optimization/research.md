# Phase 0 Research: FlatList Audit & Optimization

Resolved against the actual source tree via a scripted audit (`scripts/audit-lists.js`, added in
Phase A). No `NEEDS CLARIFICATION` remains.

---

## R1 — Which FlatList props actually matter, and which are cargo cult?

**Decision**: Fix identity and keys everywhere. Add `getItemLayout` only where row height is
genuinely fixed. Do **not** blanket-apply the virtualization knobs.

**Rationale**, prop by prop:

| Prop | Verdict | Why |
|---|---|---|
| `keyExtractor` | **Always** | Missing in 11 of 27. FlatList falls back to `item.key` → `item.id` → index, warning in dev. Index keys break reconciliation on reorder or filter. This is correctness, not perf. |
| `renderItem` via `useCallback` | **Always** | Inline in 12 of 27. A new function identity each render means FlatList's `CellRenderer` re-renders every visible cell on any parent state change. |
| `React.memo` on the row | **Only with a stable `onPress`** | Inert otherwise — see R2. |
| Hoisted `style` objects | **Always** | 19 instances pass object literals. New identity every render; also defeats memo on the list itself. |
| `getItemLayout` | **Only for fixed heights** | Currently **zero** uses in the codebase. Lets FlatList skip per-cell `onLayout` measurement. Wrong values cause misaligned scrolling, so it must not be guessed. |
| `initialNumToRender` | **Situational** | Default 10. Worth raising only where the list cannot scroll and all items are visible at once (`offerList` expand — see R4). |
| `removeClippedSubviews` | **No** | Long-standing blank-cell bugs on Android. Several of these lists are already clipped by a parent `overflow: hidden`. |
| `windowSize` / `maxToRenderPerBatch` | **No** | Virtualization tuning for long scrolling lists. Only 3 lists here are paginated, and none has shown a measured problem. Changing them without profiling is guesswork. |

**Alternatives considered**: Applying a uniform "optimized FlatList" prop set to all 27 — rejected.
It would add `removeClippedSubviews` and window tuning to short non-scrolling lists where they do
nothing or actively harm, and it obscures which changes are correctness fixes.

---

## R2 — Why is `React.memo` on row components mostly useless here today?

**Decision**: Treat `React.memo` + stable `onPress` as a single indivisible change. Never ship one
without the other.

**Rationale**: The dominant pattern in this codebase is

```jsx
renderItem={({ item }) => <Row onPress={() => onSelect(item)} item={item} />}
```

The arrow in `onPress` mints a new function per item **per render**. `React.memo` does a shallow
prop comparison, so `onPress` never compares equal and the memo always misses. Wrapping the row in
`React.memo` while leaving that closure produces zero benefit and a false sense of having
optimized the list.

The fix is to hoist the argument into the row: pass `onPress={onSelect}` (itself `useCallback`-
stable) and have the row call `onPress(item)` from its own handler. That is a **prop contract
change** on each row component, which is why `contracts/list-api.md` records it per component.

Only 12 files in `src/` use `memo(` at all today, and none of the row components in the audit are
memoized.

**Alternatives considered**: `useCallback` per item inside `renderItem` — impossible, hooks cannot
be called in a loop. A memoized callback factory keyed by item id — more machinery than passing
the item back through the handler, and it leaks memory as data grows.

---

## R3 — Two "lists" render no list at all. What are they?

**Decision**: Replace both with `ScrollView`.

**Rationale**: Two instances have neither `data` nor `renderItem`:

- `src/screens/specials.screen.js:103` — `<FlatList ListFooterComponent={renderSpecials} />`
- `src/screens/location/location-view.screen.js:395` — `<Animated.FlatList ... ListFooterComponent={renderPartner} />`

A `FlatList` with no data still constructs a `VirtualizedList` inside a `ScrollView`, with cell
bookkeeping, viewport tracking, and batch scheduling — all to render a single footer element. A
plain `ScrollView` does the same job with a fraction of the tree.

**The location-view case has a dependency**: that `Animated.FlatList` was introduced by the
`002-reanimated-migration` work as the scroll driver for the sticky header. Swapping it must
preserve `onScroll={scrollHandler}`, `scrollEventThrottle`, and the `RefreshControl`. The
Reanimated equivalent is `Animated.ScrollView`, which supports all three. Verify against
quickstart scenarios C1–C3 of the `002` feature as well as this one's.

**Alternatives considered**: Leaving them — rejected; this is the single clearest win in the audit.

---

## R4 — When is `.map()` the right answer instead of `FlatList`?

**Decision**: Convert to `.map()` only where the item count is provably bounded and the list does
not scroll. Otherwise keep `FlatList` and fix its props.

**Rationale**: 9 of 27 instances set `scrollEnabled={false}`. Virtualization exists to avoid
mounting off-screen rows in a scrollable viewport; with scrolling disabled, the list is either
fully visible or clipped by a parent, and the machinery earns nothing.

`offerList.js` is the clearest case: `scrollEnabled={false}`, wrapped in an `overflow: hidden`
animated-height container, rendering one partner's offers with `minItems={3}` at the only call
site. There the `FlatList` is pure overhead, and `initialNumToRender`'s default of 10 actively
causes pop-in during the 300ms expand animation when a partner has more than 10 offers.

**The boundedness caveat is real.** "One partner's offers" is small in the data seen at the call
site, but that is an assumption about production data, not a guarantee. Each Category B instance
must have its realistic maximum confirmed — from the API, not from a local fixture — before
converting. Where the maximum is unknown or large, keep `FlatList` and set
`initialNumToRender={data.length}` instead.

**Alternatives considered**: Converting all 9 — rejected, it bets on unverified data sizes.
Converting none — rejected, it leaves obvious overhead in place where the bound *is* known.

---

## R5 — Should this adopt FlashList?

**Decision**: No. Not in this refactor.

**Rationale**: `@shopify/flash-list` is not installed. Adding it would mean a new native
dependency, a prebuild, and per-list `estimatedItemSize` tuning across 27 instances — with real
migration friction (different `renderItem` contract, known quirks with nested lists and dynamic
heights). None of that is justified when the actual findings are missing keys, unstable identities,
and two lists that should not be lists.

FlashList becomes a reasonable conversation for the three paginated lists (`posts.screen`,
`postSearch.screen`, `locationlist.component`) **after** this cleanup and **after** profiling shows
FlatList is the bottleneck. It is recorded as a follow-up, not scoped here.

**Alternatives considered**: Adopting it for the 3 paginated lists only — still a native dependency
and a prebuild for an unmeasured benefit. Deferred deliberately.

---

## R6 — What can be verified automatically?

**Decision**: Commit the audit script; rely on it plus a manual device sweep. Do not build a
component-test harness.

**Rationale**: The audit that produced `data-model.md` is a Node script that parses each list's
opening JSX tag and reports which props are present. **It must strip comments first** — the first
run of the audit reported `keyExtractor` on `locationcards.js` and `scrollEnabled={false}` on
`posts.screen.js` because both are present but commented out. Any re-implementation that skips
comment stripping will produce a wrong inventory. Committing it as
`scripts/audit-lists.js` (+ `npm run audit:lists`) makes the inventory reproducible, so after each
phase the counts can be re-checked rather than re-eyeballed across 24 files.

What it can enforce:
1. Zero instances missing `keyExtractor`.
2. Zero inline `renderItem`.
3. Zero `FlatList` without `data`.
4. `onEndReachedThreshold` within a sane range (`<= 1`).

What it cannot: whether a row actually re-renders, whether `getItemLayout` values are correct, or
whether scroll feels smooth. Those need the device sweep and the React DevTools profiler.

**Note on the existing gates**: `npm run check:animation` (from `002`) and `npm test` must keep
passing. `npm run lint` still does not pass and did not before — see `002`'s `follow-ups.md` F3;
do not treat it as a gate here either.

**Alternatives considered**: An ESLint rule requiring `keyExtractor` — attractive, but ESLint is
still broken in this repo for unrelated reasons. The script sidesteps that entirely.

---

## R7 — Is `onEndReachedThreshold={5}` really wrong?

**Decision**: Yes. Fix to `0.5`.

**Rationale**: `src/screens/posts/posts.screen.js:521` sets `onEndReachedThreshold={5}`. The prop is
measured in **multiples of the visible list length**, not pixels and not rows. A value of `5` means
"fire when the user is within five screens of the end", which for any realistic page size is true
from the moment the list renders — so `loadNextPage` fires immediately and keeps firing.

Compare the other two paginated lists in the same codebase, which use sane values:
`postSearch.screen.js:249` uses `0.5`, and `locationlist.component.js:319` uses `0.1`/`0.5` by
platform. `posts.screen.js` is the outlier.

**Impact**: premature and repeated pagination requests — wasted network, duplicated rows if the
loader is not idempotent, and scroll-position churn. This is a **defect**, and it should be fixed
and verified with network inspection, not bundled silently into a perf commit.

**Alternatives considered**: Matching `locationlist`'s platform-split values — unnecessary
complexity; `0.5` is the common default and matches the sibling search screen.
