# Phase 1 Design: List Inventory

The "entities" of this refactor are the 27 list instances. This is the authoritative worklist.
Line numbers are from the audit on 2026-08-27 and will drift as files are edited — locators, not
addresses. Regenerate with `npm run audit:lists`.

## Legend

- **Cat** — A: not a list · B: non-scrolling · C: scrolling · D: horizontal carousel
- **Class** — why we are touching it:
  - **Correctness** — a defect. Wrong keys, wrong threshold, wrong component.
  - **Hygiene** — stable identities. Right thing to do; no measurable win expected on a short list.
  - **Perf** — plausibly measurable. Gets before/after profiling per `quickstart.md`.
- `keyEx` — has `keyExtractor` · `rI` — `inline` or `ref` · `style` — passes an object literal

---

## Full inventory

| # | File : line | Cat | keyEx | rI | style | Class | Action |
|---|---|---|---|---|---|---|---|
| 1 | `screens/specials.screen.js:103` | **A** | — | none | — | Correctness | `<FlatList ListFooterComponent>` with no `data`. → `ScrollView` |
| 2 | `screens/location/location-view.screen.js:395` | **A** | — | none | — | Correctness | Same, as `Animated.FlatList`. → `Animated.ScrollView`. **Depends on `002`** |
| 3 | `components/offerList.js:127` | B | **—** | inline | Y | Perf | `.map()` — bounded, clipped, `minItems={3}`. See §Worked example |
| 4 | `components/suggestion.js:16` | B | Y | inline | Y | Hygiene | Memoize `renderItem`, hoist style |
| 5 | `features/home/components/specialtags.js:123` | B | Y | ref | Y | Hygiene | Hoist style |
| 6 | `features/home/components/toppartners.component.js:40` | B | **—** | inline | — | Correctness | Add `keyExtractor`, memoize `renderItem` |
| 7 | `features/locations/components/locationlist.component.js:164` | B/D | **—** | inline | Y | Correctness | Horizontal **and** non-scrolling — confirm intent. Add `keyExtractor` |
| 8 | `screens/posts/post_card/postCard.component.js:531` | B | **—** | ref | — | Correctness | Add `keyExtractor` |
| 9 | `screens/posts/post_card/postCard.component.js:537` | B | **—** | ref | Y | Correctness | Add `keyExtractor`, hoist style |
| 10 | `screens/posts/post_entry/forms/postEntryMobil.component.js:829` | B | Y | inline | Y | Hygiene | Memoize `renderItem`, hoist style |
| 11 | `screens/posts/postDetailMarketplace.screen.js:210` | B | Y | ref | — | Hygiene | Derived `data` — memoize the derivation |
| 12 | `components/DropDown.js:259` | C | Y | inline | — | Hygiene | Memoize `renderItem` |
| 13 | `components/events/eventList.js:361` | C | **—** | ref | Y | Correctness | Add `keyExtractor`, hoist style. Fixed-height rows → `getItemLayout` |
| 14 | `components/NationalityInput.js:297` | C | Y | inline | — | Perf | Long static list → memoize `renderItem`, `getItemLayout` |
| 15 | `components/PhoneInput.js:352` | C | Y | inline | — | Perf | Long static list → memoize `renderItem`, `getItemLayout` |
| 16 | `features/locations/components/locationlist.component.js:299` | C | Y | ref | Y | **Perf** | Paginated. Hoist style, `React.memo` row |
| 17 | `features/profile/profSettings.js:438` | C | **—** | ref | Y | Correctness | Add `keyExtractor`. **Nested in ScrollView** — see §Nesting |
| 18 | `screens/notifications.screen.js:270` | C | **—** | ref | Y | Correctness | Add `keyExtractor`, hoist style |
| 19 | `screens/posts/posts.screen.js:477` | C | Y | ref | Y | **Perf** | Main feed, paginated. **Defect D2** — see §Defects |
| 20 | `screens/posts/postSearch.screen.js:242` | C | Y | ref | Y | **Perf** | Paginated search |
| 21 | `screens/soleil.screen.js:82` | C | Y | ref | Y | Hygiene | Hoist style |
| 22 | `screens/posts/post_entry/postEntryCategorySelect.screen.js:60` | C | Y | inline | Y | Hygiene | Memoize `renderItem`, hoist style |
| 23 | `screens/posts/post_entry/postEntryCategorySelect.screen.js:95` | C | Y | inline | Y | Hygiene | Memoize `renderItem`, hoist style |
| 24 | `components/locationcards.js:236` | D | **—** | inline | Y | Correctness | `keyExtractor` is **commented out** — restore it |
| 25 | `components/mediaUploader.js/mediaUploader.component.js:417` | D | Y | ref | Y | Hygiene | Hoist style |
| 26 | `components/slideshow.js:134` | D | Y | ref | Y | **Perf** | Image carousel — `getItemLayout` on fixed width |
| 27 | `features/home/components/category.component.js:131` | D | Y | inline | Y | **Perf** | Home screen, first paint — memoize `renderItem`, `getItemLayout` |

**Totals**: 11 missing `keyExtractor` · 12 inline `renderItem` · 19 inline styles · **0**
`getItemLayout` anywhere · 9 `scrollEnabled={false}` · 5 horizontal · 3 paginated.

**Class split**: 10 Correctness · 9 Hygiene · **8 Perf** (instances 3, 14, 15, 16, 19, 20, 26, 27).

Note: 11 instances lack `keyExtractor`, but only 10 are classed Correctness — instance 3
(`offerList`) also lacks it and is classed Perf because it gets the larger `.map()` treatment.
`npm run audit:lists` reports **9** under "missing keyExtractor" because it counts the two
no-`data` instances (1, 2) under their own violation instead of double-counting. 9 + 2 = 11.

---

## Worked example — `offerList.js` (instance 3)

Measured, not assumed: `Offer` renders a `ticketContainer` of `height: 110`; `itemSeparatorVS` is
`marginTop: 6`; so a row is **116px**, not the `OFFER_COMPONENT_HEIGHT = 120` the parent assumes.
The only call site (`location-view.screen.js:170`) passes `minItems={3}` with one location's offers.

Because the list is `scrollEnabled={false}` inside an `overflow: hidden` animated-height container,
and the count is bounded, this converts to `.map()` — removing a VirtualizedList and a ScrollView
and eliminating the `initialNumToRender` pop-in during the 300ms expand.

If the offers-per-partner maximum turns out to be unbounded (confirm against the API, per
`research.md` R4), keep `FlatList` and instead add: `keyExtractor` on `item.id`, `useCallback`
`renderItem`, hoisted style, `getItemLayout` at 116, and `initialNumToRender={data.length}`.

---

## Nesting

Two files render a `FlatList` inside a `ScrollView`, which triggers React Native's
"VirtualizedLists should never be nested inside plain ScrollViews" warning and silently disables
virtualization:

- `src/features/profile/profSettings.js` (instance 17)
- `src/screens/posts/postDetailMarketplace.screen.js` (instance 11)

Both inner lists are short. Converting them to `.map()` resolves the warning and the nesting at
once, and is preferred over `nestedScrollEnabled`, which papers over the problem.

---

## Defects found during the audit

Fix these as part of the owning instance's change, and name them in the commit so they are not
mistaken for refactor noise.

**D1 — `locationcards.js:236`: `keyExtractor` is commented out.**
The prop exists in the source but is disabled, so the list silently falls back to index keys. The
first audit run reported it as present — comment stripping is required for a correct inventory
(`research.md` R6).

**D2 — `posts.screen.js:521`: `onEndReachedThreshold={5}`.**
The unit is multiples of visible list length, so pagination fires when within *five screens* of the
end — i.e. immediately, and repeatedly. The two sibling paginated lists in the same codebase use
`0.5` (`postSearch.screen.js:249`) and `0.1`/`0.5` (`locationlist.component.js:319`). Fix to `0.5`
and verify with the network inspector that `loadNextPage` fires once per page, not per frame. See
`research.md` R7.

**D3 — 11 lists fall back to index keys.**
Missing `keyExtractor` means `item.key` → `item.id` → index. For any list that can reorder, filter,
or paginate, index keys cause row state to attach to the wrong item — stale images, wrong press
targets. This is the most widespread correctness issue in the audit.

**D4 — `posts.screen.js:477`: `scrollEnabled={false}` is commented out.**
Harmless as-is, but it means the file's history includes disabling scroll on the main feed. Worth a
glance to confirm the current behaviour is intended before touching the surrounding props.

---

## New files created by this refactor

| Path | Purpose |
|---|---|
| `scripts/audit-lists.js` | Reproducible inventory; backs the Phase F counts |
| `package.json` → `audit:lists` | Runs the above |
