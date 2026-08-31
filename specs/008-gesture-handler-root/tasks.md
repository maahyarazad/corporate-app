---
description: "Task list: gesture root, bottom-sheet containers, and modal API correctness"
---

# Tasks: Gesture Root & Bottom Sheet Correctness

**Input**: the `@gorhom/bottom-sheet` reference example, plus the modal
[usage](https://gorhom.dev/react-native-bottom-sheet/modal/usage),
[methods](https://gorhom.dev/react-native-bottom-sheet/modal/methods) and
[hooks](https://gorhom.dev/react-native-bottom-sheet/modal/hooks) pages.

**Supersedes**: the first 24-task list. Reading the three doc pages turned up a **functional bug**
that outranks most of the original scope, and `007` moved the provider, which made two tasks stale.

**Tests**: No automated test tasks. Nothing in the repo exercises gestures or sheets. Verification
is a device pass — gesture regressions only show on device.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US7
- Exact file paths in every task

---

## What the docs check found

| # | Finding | Evidence |
|---|---|---|
| **F1** | **No `GestureHandlerRootView` at the app root.** Only the legacy bare `import "react-native-gesture-handler"`. The docs make it the required outermost wrapper | `App.js:1`, `App.js:56-73` |
| **F2** | **A plain React Native `ScrollView` is used inside `BottomSheetModal`** — the docs prescribe `BottomSheetScrollView` for scrollable content | `src/components/bottomSheetSelector.component.js:68,128` |
| **F3** | `snapPoints` is `useMemo(() => [windowSize], [])` — empty deps while reading the `windowSize` prop | `src/components/bottomSheetSelector.component.js:26` |
| **F4** | The present/dismiss effect declares `[display]` but reads `data` | `src/components/bottomSheetSelector.component.js:30-38` |
| **F5** | `useBottomSheetModal` is exported by the installed version and used nowhere; dismissal is driven by a parent prop instead | `node_modules/@gorhom/bottom-sheet` |
| **F6** | `GestureHandlerRootView` **imported but never rendered** | `src/components/hotpick/hotpicks.component.js:17` |
| **F7** | `GestureHandlerRootView` rendered **deep inside a modal**, with layout styles rather than `flex: 1` | `src/components/videoPlayerModal/videoPlayerModal.component.js:22` |
| **F8** | `BottomSheetModal` / `BottomSheetModalProvider` **imported but never rendered** | `src/screens/posts/comments/comment.component.js:32-33` |

### F2 is the one that matters

The usage page's structure is `GestureHandlerRootView → BottomSheetModalProvider → BottomSheetModal
→ BottomSheetView`, and it points at separate documentation for scrollable content — meaning the
container is not interchangeable with a plain `ScrollView`.

`BottomSheetScrollView` wires the scroll gesture into the sheet's own gesture handler, so a drag at
scroll-top moves the sheet and a drag mid-list scrolls the content. With React Native's `ScrollView`
the two contend for the same pan, which is what "the sheet won't drag" and "the list won't scroll"
usually are.

**`BottomSheetScrollView` is already exported by the installed 4.6.4** — verified in its type
definitions alongside `BottomSheetView`, `BottomSheetFlatList`, `BottomSheetSectionList` and
`BottomSheetTextInput`. No upgrade needed.

### Confirmed correct, no action

The methods page documents exactly two modal-specific methods, `present(data?)` and
`dismiss(animationConfigs?)`, with everything else inherited from Bottom Sheet.
`bottomSheetSelector.component.js` uses both correctly.

### Stale after `007`

`BottomSheetModalProvider` is no longer a plain JSX wrapper at `navigation.js:348`. The static
config conversion moved it into `OverlappingNavigator`'s **`layout`** key — it now renders at
`navigation.js:355`. Tasks referencing the old location have been rewritten.

---

## Phase 1: Setup — record what sheets and gestures do today

- [!] T001 Create branch `008-gesture-handler-root` from `007-static-navigation`, whose `navigation.js` already carries which already carries the static-config conversion and the provider move
- [!] T002 On a release build, record current behaviour in `specs/008-gesture-handler-root/follow-ups.md`: swipe-back from a pushed screen, the video modal in `src/components/videoPlayerModal/videoPlayerModal.component.js`, the hotpicks carousel in `src/components/hotpick/hotpicks.component.js`, and — most importantly — the sheet from `src/components/bottomSheetSelector.component.js` opened from a post card's options menu
- [!] T003 For the sheet specifically, record in `specs/008-gesture-handler-root/follow-ups.md` whether **dragging the sheet by its content** works, whether the list scrolls, and whether the two interfere. That is the F2 symptom and the before/after that matters
- [!] T004 [P] Note the device model and Android version in `specs/008-gesture-handler-root/follow-ups.md` — gesture contention is more visible on lower-end hardware

**Checkpoint**: Current sheet and gesture behaviour recorded

---

## Phase 2: Foundational — none

Each story is independent beyond the Phase 1 baseline.

---

## Phase 3: US1 — GestureHandlerRootView at the app root (Priority: P1) 🎯 MVP

**Goal**: The docs make this the required outermost wrapper. The app does not have one.

**Independent test**: The app renders, and every gesture from T002 still works.

- [X] T005 [US1] Import `GestureHandlerRootView` from `react-native-gesture-handler` in `App.js` and wrap the whole returned tree with it, replacing the bare `<>` fragment at `App.js:57`. It must be **outermost** — outside `ThemeProvider` and every context provider
- [X] T006 [US1] Give it `style={{ flex: 1 }}` in `App.js`, hoisted to a module constant. **Without a flex style the root collapses to zero height and the app renders blank** — the most common mistake with this component
- [X] T007 [US1] Keep the bare `import "react-native-gesture-handler"` at `App.js:1` unless the `react-native-gesture-handler@2.28.0` docs say otherwise — it is load-bearing for module registration order. Record the decision in `specs/008-gesture-handler-root/follow-ups.md`
- [!] T008 [US1] Device pass on the `App.js` change: confirm the app renders at all before checking anything else, then re-run every gesture from T002 against the baseline

---

## Phase 4: US2 — Use the bottom-sheet scroll container (Priority: P1)

**Goal**: Replace React Native's `ScrollView` with `BottomSheetScrollView` so the sheet and its content stop fighting over the same pan gesture. **This is a functional bug, not a style preference.**

**Independent test**: T003's checks — dragging the sheet by its content moves the sheet; the list still scrolls when it overflows; neither blocks the other.

- [X] T009 [US2] Replace the `ScrollView` import from `react-native` at `src/components/bottomSheetSelector.component.js:1-8` with `BottomSheetScrollView` from `@gorhom/bottom-sheet`, added to the existing import at lines 10-13. Verified available in the installed 4.6.4
- [X] T010 [US2] Swap the `<ScrollView>` at `src/components/bottomSheetSelector.component.js:68` and its closing tag at line 128 for `<BottomSheetScrollView>`, keeping `style={{ marginHorizontal: 12 }}` unchanged
- [!] T011 [US2] Consider whether this content needs to scroll at all. It renders `data.map(...)` over an options menu — if the list is always short, `BottomSheetView` is the documented container for non-scrollable content and is simpler. Record the choice and the realistic maximum option count in `specs/008-gesture-handler-root/follow-ups.md`
- [!] T012 [US2] Device pass on all three call sites — `src/screens/posts/post_card/postCard.component.js:635`, `src/screens/posts/post_card/postCardHeader.component.js:155`, `src/screens/posts/comments/comment.component.js:381`. Compare against the T003 baseline

**Checkpoint**: Sheet drag and content scroll no longer contend

---

## Phase 5: US3 — Remove the nested GestureHandlerRootView (Priority: P2)

**Goal**: A second gesture root deep inside a modal is not the documented pattern and can swallow gestures from above it.

**Independent test**: The video modal opens, plays and dismisses; its internal gestures work.

- [X] T013 [US3] Replace the `<GestureHandlerRootView>` at `src/components/videoPlayerModal/videoPlayerModal.component.js:22` with a plain `<View>`, keeping its layout styles exactly. Once US1 lands, the app root provides the gesture context
- [X] T014 [US3] Remove the now-unused `GestureHandlerRootView` import at `src/components/videoPlayerModal/videoPlayerModal.component.js:4` and add `View` to the `react-native` import if absent
- [!] T015 [US3] Device pass on `src/components/videoPlayerModal/videoPlayerModal.component.js` — open, scrub, dismiss. **Most likely task to regress**, because the nested root may be doing real work that no app-level root previously provided

---

## Phase 6: US4 — Selector correctness (Priority: P2)

**Goal**: Three defects in `bottomSheetSelector.component.js` that the docs review surfaced. Small, and independent of the container change.

**Independent test**: A caller passing a non-default `windowSize` gets that height; a sheet whose `data` arrives after `display` still presents.

- [X] T016 [US4] Fix the stale `snapPoints` memo at `src/components/bottomSheetSelector.component.js:26`: `useMemo(() => [windowSize], [])` reads the `windowSize` prop with an empty dependency array, so a caller passing a different value gets the first one forever. Add `[windowSize]`
- [X] T017 [US4] Fix the present/dismiss effect at `src/components/bottomSheetSelector.component.js:30-38`: it declares `[display]` but reads `data`. If `data` arrives after `display` is already true the sheet never presents. Add `data` to the dependency array, or restructure the condition
- [X] T018 [US4] ~~Adopt~~ **CONSIDERED, NOT ADOPTED** — `display` is the component's public contract and three call sites drive it; changing who owns dismissal is a behaviour change for another pass. See `follow-ups.md`. Original task: evaluate `useBottomSheetModal` for dismissal. The hooks page gives `dismiss(key?)` and `dismissAll()`, callable from any component inside `BottomSheetModalProvider`. Today `handleSelect` at `src/components/bottomSheetSelector.component.js:39` calls `option.onPress()` and relies on the parent flipping `display`. Dismissing from inside is the documented pattern — but it is a **behaviour change** to the component's contract, so record the decision in `specs/008-gesture-handler-root/follow-ups.md` before changing it
- [X] T019 [US4] Remove the leftover `console.log("handleSheetChanges", index)` at `src/components/bottomSheetSelector.component.js:27` — it is copied straight from the docs example and fires on every sheet position change

---

## Phase 7: US5 — Remove dead imports (Priority: P2)

**Goal**: Two files import APIs they never render.

**Independent test**: Both files parse and behave identically; nothing rendered changes.

- [X] T020 [P] [US5] Remove the unused `GestureHandlerRootView` import at `src/components/hotpick/hotpicks.component.js:17` — verified it appears only on the import line
- [X] T021 [P] [US5] Remove the unused `BottomSheetModal` and `BottomSheetModalProvider` imports at `src/screens/posts/comments/comment.component.js:32-33` — the file renders `<BottomSheetSelector>` at line 381 and no sheet component directly
- [X] T022 [US5] Confirm with a repo-wide grep that no other file imports gesture or bottom-sheet APIs without rendering them, then commit

---

## Phase 8: US6 — Provider placement (Priority: P3)

**Goal**: The docs put `BottomSheetModalProvider` immediately inside the gesture root. This app renders it inside a navigator's `layout`.

**⚠️ Behaviour change, not cleanup.** Moving it changes where sheets mount and how they stack against headers.

**Independent test**: Every `BottomSheetSelector` call site opens a working sheet.

- [X] T023 [US6] Confirm the three call sites — `src/screens/posts/post_card/postCard.component.js:635`, `src/screens/posts/post_card/postCardHeader.component.js:155`, `src/screens/posts/comments/comment.component.js:381` — all sit under `OverlappingNavigator`, whose `layout` now provides the provider at `navigation.js:355`. Record the answer in `specs/008-gesture-handler-root/follow-ups.md`
- [X] T024 [US6] **If all three are covered, close this story with no change** and record that in `specs/008-gesture-handler-root/follow-ups.md`. Moving a working provider for symmetry with an example is risk without benefit, and the `007` `layout` placement is a legitimate way to scope it
- [X] T025 [US6] ~~SKIPPED — US6 closed at T024, all call sites covered.~~ Original: Only if a call site is uncovered: move `BottomSheetModalProvider` from the `layout` key at `navigation.js:355` to `App.js`, immediately inside `GestureHandlerRootView`, and drop the `@gorhom/bottom-sheet` import from `navigation.js`
- [X] T026 [US6] ~~SKIPPED — provider not moved.~~ Original: If `App.js` now hosts the provider, verify every sheet still presents, dismisses, and renders **above** navigation headers, then commit

---

## Phase 9: US7 — `@gorhom/bottom-sheet` v4 on Fabric (Priority: P3) ⚠️ CONTINGENT

**Goal**: 4.6.4 predates New Architecture support. Worth knowing; not worth bundling in.

**⚠️ Only start if sheets still misbehave after US1–US4.**

- [!] T027 [US7] Check the `@gorhom/bottom-sheet` changelog for the version that added Fabric support and record the gap against the installed 4.6.4 in `specs/008-gesture-handler-root/follow-ups.md`
- [!] T028 [US7] If the version gap is the cause, plan the v5 upgrade to `package.json` as its own feature with its own regression pass — do not fold it in here
- [!] T029 [US7] Record the decision either way in `specs/008-gesture-handler-root/follow-ups.md`

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T030 Run the gates: `npm run check:animation`, `npm run audit:lists`, `npm test` (27/27)
- [!] T031 [P] Full iOS pass — `App.js` and `bottomSheetSelector.component.js` are shared, so both changes affect iOS even though the motivation is Android
- [!] T032 [P] Re-measure the `006` transition scenario after US1 and record it in `specs/008-gesture-handler-root/follow-ups.md`. A missing gesture root plausibly affects swipe-back responsiveness
- [!] T033 Update `specs/006-android-navigation-lag/follow-ups.md` with whether the gesture root contributed to the Android symptoms

---

## Dependencies

```
Phase 1 (T001-T004) baseline
        │
        ├──► US1 (T005-T008)  🎯 gesture root at the app root
        │         │
        │         └──► US3 (T013-T015)  remove the nested root ── needs US1
        │
        ├──► US2 (T009-T012)  BottomSheetScrollView ── independent of US1
        │
        ├──► US4 (T016-T019)  selector correctness ── independent
        │
        └──► US5 (T020-T022)  dead imports ── independent
                  │
                  v
             US6 (T023-T026)  provider placement ── T024 may close it
                  │
                  v
             Phase 10 (T030-T033)
                  │ (sheets still wrong?)
                  v
             US7 (T027-T029) ⚠️ contingent
```

**Hard dependencies**:
- **T005/T006 block T013.** Do not remove the nested gesture root before the app root exists, or the
  video modal loses gesture context entirely
- T003 (sheet baseline) blocks T012 — the F2 fix cannot be judged without a before
- T023 gates T025, and **T024 may legitimately end US6 with no change**

**Soft ordering**: US2, US4 and US5 are independent of US1 and of each other. US2 is the one most
likely to fix something a user would notice.

**File collisions — never parallel**: T005/T006/T007 and T025 all touch `App.js`; T009, T010, T016,
T017, T018 and T019 all touch `bottomSheetSelector.component.js`; T013 and T014 both touch
`videoPlayerModal.component.js`.

## Parallel execution examples

```
T020   # src/components/hotpick/hotpicks.component.js
T021   # src/screens/posts/comments/comment.component.js
```

```
T031, T032   # iOS pass and Android measurement, different devices
```

## Implementation strategy

**MVP scope**: T001–T012 — the baseline, the gesture root, and the scroll container. Those two
changes are what the three doc pages actually prescribe, and they are the two most likely to change
what a user experiences.

**If you only do one thing**: **US2**. F2 is a real functional bug — a plain `ScrollView` inside a
bottom sheet makes the sheet and its content fight over the same pan gesture, and
`BottomSheetScrollView` is already installed. US1 is more structurally important, but US2 is the one
with a visible symptom you can test in thirty seconds.

**The one that will bite**: **T006**. A `GestureHandlerRootView` without `flex: 1` renders a blank
app. T008 checks "does it render at all" before checking any gesture, for that reason.

**The one to resist**: **T025**. Moving a working provider to match an example is a behaviour change
with no benefit. T023/T024 exist to establish that the current `layout` placement already covers
every call site — which it very likely does.
