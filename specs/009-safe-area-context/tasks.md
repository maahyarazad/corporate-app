---
description: "Task list for the react-native-safe-area-context migration"
---

# Tasks: Safe Area Context Migration

**Input**: "replace safearea.component.js with `SafeAreaProvider` / `SafeAreaView` from `react-native-safe-area-context`"

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/safe-area.md`, `quickstart.md`, `spec.md`

**Tests**: No automated test tasks. The repo has 27 Jest tests, all pure logic, and no component or
visual-regression harness. Verification is a device pass — `quickstart.md` holds the script, and
those manual checks are the contract tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 from `spec.md`
- Exact file paths in every task

---

## Phase ordering note

Phases run in **dependency order, not spec-numbering order**. US2 (the provider) is the enabler for
everything else and carries no visual risk, so it ships first and is the MVP. US1 and US2 are both
P1; US1's grep criterion (SC-001) is only fully satisfied once US3 also lands.

---

## What the survey found

| # | Finding | Evidence |
|---|---|---|
| **F1** | RN's `SafeAreaView` is deprecated and will be removed | `react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:25` |
| **F2** | It is a **no-op on Android** — renders a plain `View` | why `safearea.component.js:7` hand-rolls `StatusBar.currentHeight` |
| **F3** | **10 files bypass the wrapper** and import RN's directly | each resolves to `"react-native"`; they have *no* Android top inset |
| **F4** | A provider already exists, but only inside the navigators | `@react-navigation/elements/.../SafeAreaProviderCompat.js` |
| **F5** | That compat provider **stands down** under a root provider | its own comment: "don't wrap the stack in another safe area provider" |
| **F6** | `Toast` and `ConfirmDialogHost` render with **no provider above them** | `App.js:87`, `App.js:88` |
| **F7** | A second `no-restricted-imports` entry **silently drops the first** | tested: 2 entries → 1 error; 1 combined entry → 2 errors |
| **F8** | `styles.default` is `{}` — dead | `safearea.component.js:22` |

### F7 is the trap

The obvious way to add the lint ban regresses `002`'s `Animated`/`InteractionManager` guardrail with
no warning at all. See T031.

---

## Phase 1: Setup — capture the baseline

- [X] T001 Record the current `grep` baselines to a scratch file: `grep -rn "SafeAreaView" src`, `grep -rn "SafeAreaProvider" App.js src`, `grep -rn "StatusBar.currentHeight" src` — these become the SC-001/002/003 before-and-after evidence
- [X] T002 Run all five gates and record they are green before any edit: `npm test`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists`
- [ ] T003 On an **Android** device, screenshot the top and bottom edges of `src/screens/home.screen.js`, `src/screens/posts/posts.screen.js`, `src/screens/login/login.screen.js`, `src/screens/map.screen.js` and `src/screens/profile/profile.screen.js` — the R5 comparison set  **[BLOCKED: no Android/iOS device]**
- [ ] T004 [P] On an **iOS** device with a notch, screenshot the same five screens  **[BLOCKED: no Android/iOS device]**

---

## Phase 2: Foundational — none

Nothing blocks the user stories. The library is already installed (`package.json:114`,
`react-native-safe-area-context@5.6.2`) and already used once (`entertainer.screen.js:18`). There is
no install step, no native rebuild and no config change.

---

## Phase 3: US2 — SafeAreaProvider at the app root (Priority: P1) 🎯 MVP

**Goal**: insets become readable everywhere, including outside the navigators. Zero visual change.

**Independent test**: exactly one `SafeAreaProvider` exists, in `App.js`; a toast and a confirm
dialog clear the system bars; cold start shows no inset jump on frame 1.

- [X] T005 [US2] Import `SafeAreaProvider` and `initialWindowMetrics` from `react-native-safe-area-context` in `App.js`
- [X] T006 [US2] Wrap the tree in `<SafeAreaProvider initialMetrics={initialWindowMetrics}>` in `App.js`, placed **inside** `GestureHandlerRootView` (`App.js:57`) and **outside** `ThemeProvider` (`App.js:58`), so it also covers the `Toast` (`App.js:87`) and `ConfirmDialogHost` (`App.js:88`) siblings
- [X] T007 [US2] Verify `GestureHandlerRootView` keeps `styles.root` / `flex: 1` (`App.js:98`) — `008` requires it stay the outermost element and it collapses to zero height without the flex
- [X] T008 [US2] Confirm exactly one provider: `grep -rn "SafeAreaProvider" App.js src | grep -v Compat` returns one hit (SC-002)
- [ ] T009 [US2] Device check — app boots on both platforms, no blank screen, no first-frame inset jump, toast and confirm dialog both clear the status bar  **[BLOCKED: no Android/iOS device]**

---

## Phase 4: US1 — Swap the shared component (Priority: P1)

**Goal**: `src/components/safearea.component.js` stops using the deprecated import. 26 files and 38
call sites inherit the change with no edit of their own.

**Independent test**: the component no longer imports from `react-native`; all 38 call sites render;
the map is still interactive.

- [X] T010 [US1] Replace the `react-native` `SafeAreaView` import with `react-native-safe-area-context`'s in `src/components/safearea.component.js`, and drop the now-unused `StatusBar` and `Platform` imports
- [X] T011 [US1] Delete the `styled(SafeAreaView)` wrapper and the `Platform.OS === "android" ? padding-top: ${StatusBar.currentHeight}px` branch in `src/components/safearea.component.js` (FR-006) — the library handles Android natively
- [X] T012 [US1] Remove the `styled-components/native` import from `src/components/safearea.component.js` (F8 cleanup; it is the only consumer left in this file)
- [X] T013 [US1] Replace the dead `styles.default = {}` with a real `styles.container = { flex: 1 }` in `src/components/safearea.component.js` and apply it as `style={[styles.container, style]}` so caller style still wins (FR-004, F8)
- [X] T014 [US1] Add the `edges` passthrough prop to `SafeArea` in `src/components/safearea.component.js`, defaulting per the R5 decision (T017) — **not** hardcoded (FR-005)
- [X] T015 [US1] Confirm `pointerEvents` is still forwarded in `src/components/safearea.component.js` (FR-004) — `src/screens/map.screen.js:457` is the only consumer and losing `box-none` makes the whole map untappable
- [X] T016 [US1] Run `npm run check:styles` — no inline style literal may be introduced (FR-007, R6); the README snippet's `style={{ flex: 1 }}` fails this

---

## Phase 5: US3 — The ten direct importers (Priority: P2)

**Goal**: remove the last `react-native` `SafeAreaView` imports and give these screens the Android
top inset they never had (F3).

**Independent test**: `grep -rn "SafeAreaView" src | grep -v safe-area-context` returns nothing
(SC-001), and each of the ten screens starts below the status bar on Android.

### The blocking decision

- [X] T017 [US3] **Decide `edges` on an Android device** before editing any of the ten. Build US1 with `edges={["top"]}`, screenshot the T003 set, rebuild with the default (all edges), screenshot again, diff the bottom delta. Record the choice and the device in `specs/009-safe-area-context/follow-ups.md`. Per R5 the recommendation is to ship behaviour-neutral first.

### The migrations — all parallel, all different files

- [X] T018 [P] [US3] Replace the RN `SafeAreaView` import and the `<SafeAreaView>` at `src/screens/home.screen.js:450` with the shared `SafeArea` from `src/components/safearea.component.js`
- [X] T019 [P] [US3] Same in `src/screens/posts/postDetail.screen.js:286`
- [X] T020 [P] [US3] Same in `src/screens/posts/postSearch.screen.js:210`
- [X] T021 [P] [US3] Same in `src/screens/posts/postDetailMarketplace.screen.js:386` — note it passes an inline `{ backgroundColor: "white" }`; the background must still extend under the inset (contract guarantee 4) and the inline literal should move to `StyleSheet` while touched (FR-007)
- [X] T022 [P] [US3] Same in `src/screens/posts/posts.screen.js:458`
- [X] T023 [P] [US3] Same in `src/screens/posts/post_entry/postEntry.screen.js:138`
- [X] T024 [P] [US3] Same in `src/screens/posts/post_entry/postEntrySelect.screen.js:127`
- [X] T025 [P] [US3] Same in `src/screens/posts/post_entry/postEntryCategorySelect.screen.js:114`
- [X] T026 [US3] Migrate `src/screens/profile/profile.screen.js:242` — this file uses **both** patterns (`SafeArea` at `:65`, RN `SafeAreaView` at `:242`); check both render paths, not just the one edited
- [X] T027 [US3] Migrate `src/screens/posts/post_card/postCard.component.js:594` — it is a **component, not a screen**, so verify it is not rendered inside a screen that already wraps in `SafeArea`; a nested safe area applies the inset twice

### Verification

- [ ] T028 [US3] Device pass on Android over all ten screens — content starts below the status bar (the F3 fix), and nothing is double-padded  **[BLOCKED: no Android/iOS device]**

---

## Phase 6: US4 — Lock out the deprecated import (Priority: P3)

**Goal**: the migration cannot silently regress.

**Independent test**: a file with `import { SafeAreaView } from "react-native"` fails lint, **and** a
file importing `Animated` from `react-native` still fails.

- [X] T029 [US4] Add `"SafeAreaView"` to the **existing** `no-restricted-imports` entry's `importNames` array for `"react-native"` in `.eslintrc.json` (currently `["Animated", "InteractionManager"]`)
- [X] T030 [US4] Update that entry's `message` in `.eslintrc.json` to cover all three names, since ESLint attaches one message per path entry and not per import name
- [X] T031 [US4] **Verify `002`'s ban survived** — write a scratch file importing both `Animated` and `SafeAreaView` from `react-native` and confirm `npx eslint` reports **two** errors, not one (SC-005, F7). One error means a second path entry was added instead of extending the first, and the `Animated` ban has been silently lost
- [X] T032 [US4] Run `npx eslint src` and confirm no new error classes beyond the known pre-existing baseline

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 Re-run all five gates: `npm test` (27/27), `check:styles`, `check:screen-props`, `check:animation`, `audit:lists` (SC-004)
- [X] T034 [P] Confirm SC-001 — `grep -rn "SafeAreaView" src | grep -v safe-area-context` returns nothing
- [X] T035 [P] Confirm SC-003 — `grep -rn "StatusBar.currentHeight" src` returns nothing
- [ ] T036 Device check on `src/screens/map.screen.js` — pan, zoom and marker taps all work through the `pointerEvents="box-none"` overlay at `:457` (SC-006), and the absolutely-positioned `safeArea2` still sits correctly (the open question in `research.md`)  **[BLOCKED: no Android/iOS device]**
- [ ] T037 [P] Rotation and Android navigation-mode checks — rotate to landscape and back, then toggle gesture ↔ three-button nav in system settings **while the app runs**; layout re-flows with no stale padding  **[BLOCKED: no Android/iOS device]**
- [X] T038 Write `specs/009-safe-area-context/follow-ups.md` recording the R5 `edges` decision, the device it was made on, and anything deliberately not done

---

## Dependencies

```
Phase 1 (T001-T004)  baseline
      |
Phase 2              none
      |
Phase 3  US2  T005-T009   provider          <- MVP, zero visual risk, ships alone
      |
Phase 4  US1  T010-T016   shared component  <- 26 files inherit
      |
      +-- T017 [US3] edges decision  <- BLOCKS T018-T028, needs an Android device
      |
Phase 5  US3  T018-T028   the ten files
      |
Phase 6  US4  T029-T032   lint guardrail
      |
Phase 7       T033-T038   polish
```

**Hard dependencies**

- T006 depends on T005 (same file, same edit)
- T014 depends on T017 — the default is a decision, not an assumption
- T018–T027 all depend on T017
- T031 depends on T029 and T030, and is the only check that catches F7
- T028 and T036 depend on device availability

**Not dependencies**

- US4 does not depend on US3. The lint rule can land as soon as US1 is done; it will simply fail on
  the ten files until they migrate, which is arguably the point.

---

## Parallel execution examples

**Phase 5, after T017 unblocks:** T018–T025 are eight different files with no shared state and can
go in parallel. T026 and T027 are held back deliberately — `profile.screen.js` has two render paths
and `postCard.component.js` risks double-wrapping, so both want individual attention.

**Phase 7:** T034, T035 and T037 are independent checks.

---

## Implementation strategy

**MVP = Phase 3 (US2) alone.** Five tasks, one file, no visual change, and it independently fixes
`Toast` and `ConfirmDialogHost` rendering without a provider. It is worth shipping on its own.

**Incremental delivery:** each phase is separately revertable. Phase 4 is one file. If Android layout
regresses in Phase 5 and nobody is available to triage, revert Phase 5 and keep 3 and 4 — the
deprecation is still resolved for 26 of the 36 files.

**Stop condition:** if no Android device is available, stop after Phase 4 and record why. `006` and
`007` both stopped for exactly this reason and were right to
(`specs/006-android-navigation-lag/follow-ups.md`: "no code written. That is the correct outcome so
far."). This feature is entirely visual; shipping it unverified would be guessing.

**Never combine** the deprecation swap and the `edges` widening in one commit. Review cannot tell
them apart, and R5's bottom-inset change touches roughly 36 screens.
