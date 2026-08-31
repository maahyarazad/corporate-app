# Findings — gesture root & bottom sheet correctness

## Shipped

| Task | Change |
|---|---|
| T005–T007 | `GestureHandlerRootView` now wraps the whole tree in `App.js`, outermost, with `flex: 1` hoisted to `styles.root` |
| T009–T010 | `bottomSheetSelector.component.js` uses `BottomSheetScrollView` instead of React Native's `ScrollView` |
| T013–T014 | `videoPlayerModal.component.js`'s nested `GestureHandlerRootView` → plain `View` |
| T016 | `snapPoints` memo deps `[]` → `[windowSize]` |
| T017 | present/dismiss effect deps `[display]` → `[display, data]` |
| T019 | Removed the docs-example `console.log("handleSheetChanges", index)` and the now-purposeless `onChange` |
| T020–T022 | Dead imports removed |
| T023–T024 | **US6 closed with no change** — see below |

## US6 closed deliberately

`BottomSheetModalProvider` stays in `OverlappingNavigator`'s `layout` key (`navigation.js:355`,
placed there by `007`). All three `BottomSheetSelector` call sites are covered:

| Call site | Reached from | Screen in `OverlappingNavigator` |
|---|---|---|
| `postCard.component.js:635` | `postDetail.screen.js`, `postSearch.screen.js`, `posts.screen.js` | `post-detail`, `post-search`, `post-tabs` |
| `postCardHeader.component.js:155` | `postDetailMarketplace.screen.js`, `postCardMagazine`, `postCardMarketplace` | `marketplace-details`, `magazine-details` |
| `comment.component.js:381` | `commentSection.component.js` | rendered inside the post detail screens |

Moving a working provider to match an example is risk with no benefit. The `layout` placement is a
legitimate way to scope it and it stays.

## T018 — `useBottomSheetModal` considered, not adopted

The hooks page gives `dismiss(key?)` and `dismissAll()`, callable from any component inside the
provider. `BottomSheetSelector` currently dismisses via a ref when the parent flips its `display`
prop.

**Not changed.** `display` is part of the component's public contract and three call sites drive it.
Switching to `useBottomSheetModal().dismiss()` from inside would change who owns dismissal — a
behaviour change worth making deliberately, not as part of a container fix. Left for a future pass.

## Removed a piece of the docs example that was copied in

`handleSheetChanges` existed only to `console.log` the sheet index on every position change — it is
lifted verbatim from the reference example. Both it and the `onChange` prop wired to it are gone.
If sheet-position tracking is wanted later, add it back with a real handler.

## Also confirmed against the docs

- `present()` / `dismiss()` are the only two modal-specific methods, and both were already used
  correctly. No change needed.
- `BottomSheetScrollView` is exported by the installed **4.6.4** — verified in its type definitions
  alongside `BottomSheetView`, `BottomSheetFlatList`, `BottomSheetSectionList`,
  `BottomSheetTextInput`. **No upgrade was required** to fix the container.

## NOT verified — no device

Nothing here has run. In risk order:

1. **T008** — does the app render at all? A `GestureHandlerRootView` without a working flex style
   shows a blank screen. `flex: 1` is set, but this is the first thing to check.
2. **T015** — the video modal. Its nested gesture root may have been doing real work that no
   app-level root previously provided; this is the most likely regression.
3. **T012** — the sheet at all three call sites: does dragging the content move the sheet, does the
   list still scroll, do they stop fighting?
4. **T032** — re-measure the `006` transition scenario. A missing gesture root plausibly affected
   swipe-back responsiveness, and this is the first time the app has had one.

## Still open

`@gorhom/bottom-sheet` 4.6.4 predates New Architecture support (US7, contingent). Only worth
pursuing if sheets still misbehave after the above is verified on a device.
