---
description: "Task list for the Android-only stack navigation lag"
---

# Tasks: Android Stack Navigation Lag

**Renumbered 005 → 006**: `specs/005-static-screen-options/` already exists on branch
`005-static-screen-options`. That feature is allocation hygiene in the same file; this one is the
Android transition lag. They are complementary — 005 deliberately preserved `forHorizontalIOS` as a
behaviour-preserving refactor and never asked whether forcing it on Android is itself the cost.

**Input**: "tested the release version on android, navigation from different stack is still laggy, and it is only in android"

**Prerequisites**: none — `/speckit-plan` was not run for this feature. The findings below were
gathered directly from the source tree and stand in for `plan.md`/`research.md`. Run
`/speckit-plan 005` if formal artifacts are wanted.

**Tests**: No automated test tasks. Verification is device measurement — and unlike `004`, that is
now possible: a release build exists and the symptom is reproducible.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which suspect this serves (US1–US6)
- Exact file paths in every task

---

## What the release build result changes

The `004` investigation is closed by this report. **S2 (debug build) is eliminated** — the lag
survives a release build. The `android_build_log.txt` scan confirmed the earlier testing was
`compileDebugKotlin` with Metro serving the bundle, so those measurements were invalid, but this
one is not.

The new symptom is much more specific than "the app is laggy": **stack-to-stack transitions,
Android only**. That is a different problem from list scrolling, and it points at the navigator,
not at the components `002`–`004` touched.

### Findings from the source tree

| # | Finding | Evidence |
|---|---|---|
| **F1** | **23 screens force `CardStyleInterpolators.forHorizontalIOS`** — 21 via `slideFromRight`, 2 inline. This is the iOS card transition, driven from JS, applied on Android where the platform default is cheaper | `navigation.js` |
| **F2** | **`@react-navigation/stack` is used everywhere; `@react-navigation/native-stack` is not installed.** The JS stack animates transitions in JavaScript; `native-stack` hands them to native Fragments | `package.json`, 5 imports |
| **F3** | `@react-navigation/native` is **6.0.10** — the v6 line predates New Architecture stabilisation, and this app runs Fabric. Sibling packages are drifted (stack 6.2.1, material-top-tabs 6.6.14) | `node_modules` |
| ~~F4~~ | ~~`detachInactiveScreens` set on 1 of 6 navigators~~ — **WITHDRAWN.** `@react-navigation/stack` already defaults it to `true` on Android (`node_modules/@react-navigation/stack/lib/commonjs/views/Stack/CardStack.js:317`). The explicit setting on `HomeStack` is redundant, and adding it elsewhere would be a no-op | verified in `node_modules` |
| **F5** | Nesting is 4 deep: `MainStack → OverlappingStack → Entertainer (material-top-tabs) → HomeStack` | `navigation.js`, `src/screens/entertainer.screen.js` |
| **F6** | `freezeOnBlur` / `enableFreeze()` used nowhere | repo-wide grep |
| **F7** | `gestureResponseDistance: 200` on every `slideFromRight` screen — a wide active pan region on Android | `navigation.js`, 4 sites |

### The timing detail that matters

**F1 recently got worse, and it is sitting uncommitted in the working tree right now.** The
`navigation.js` edit extended `slideFromRight` to Profile, Map, and three auth screens that
previously used `{ headerShown: false }` and therefore got Android's *native* default transition.
Those five screens switched to the JS-driven iOS slide.

If the lag got noticeably worse recently, that edit is the first thing to test — and it is
`git stash` away from being tested.

---

## Note on "user stories"

No `spec.md`. The six stories are the suspects above, ordered by **cost to test**, not by
confidence. US1 is minutes of work and could be most of the fix; US2 is the structurally correct
answer and is days.

---

## Phase 1: Setup — reproduce and scope the symptom

**Purpose**: Pin down *which* transitions are slow before changing the navigator

- [ ] T001 Create branch `005-android-navigation-lag` from `004-android-performance`. Note that `navigation.js`, `app.json` and `src/screens/entertainer.screen.js` currently carry uncommitted changes — decide whether to commit or stash them before starting, because `navigation.js` is central to this investigation
- [ ] T002 Identify exactly which transitions lag, recording the matrix in `specs/006-android-navigation-lag/follow-ups.md`. Push and pop between: Entertainer tab → `post-detail`, Entertainer → Profile, Home → `LocationList`, and `LocationList` → `Location View`. Record which are slow, whether **push** or **pop** or both, and whether the first transition to a screen differs from subsequent ones. First-time-only lag means mount cost; every-time lag means the transition itself
- [ ] T003 Capture the baseline with `adb shell dumpsys gfxinfo com.buenapublica.GECRewards reset`, perform 10 push/pop cycles on the worst transition from T002, then `framestats`. Median of 3 runs. Record in `specs/006-android-navigation-lag/follow-ups.md`
- [ ] T004 [P] Confirm the same transitions from T002 are smooth on iOS and record it in `specs/006-android-navigation-lag/follow-ups.md`, so "Android only" is measured rather than assumed
- [ ] T005 [P] Record the device model, Android version and RAM in `specs/006-android-navigation-lag/follow-ups.md`. Stack transition cost scales hard with device tier, and a low-RAM device changes which fix matters

**Checkpoint**: The slow transition is named and measured

---

## Phase 2: Foundational — confirm the transition is the cost, not the destination screen

**Purpose**: Separate "the animation is slow" from "the screen being pushed is expensive to mount"

- [ ] T006 Temporarily set `animationEnabled: false` in the `slideFromRight` constant in `navigation.js` and repeat T002. **If the lag disappears, the transition animation is the cost → US1/US2.** If it persists with no animation at all, the destination screen's mount is the cost → US4
- [ ] T007 Record the T006 result in `specs/006-android-navigation-lag/follow-ups.md`, then revert the temporary change. This single experiment decides whether Phase 3–4 or Phase 6 is the real work

**Checkpoint**: The cost is attributed to either the animation or the mount

---

## Phase 3: US1 — Stop forcing the iOS card interpolator on Android (Priority: P1) 🎯 MVP

**Goal**: 23 screens run an iOS-style JS-driven slide on Android, where the platform default is cheaper. Minutes to test, and it is the change that most recently got worse.

**Independent test**: T003's transition, re-measured. Android transitions should visibly match platform-native behaviour; iOS must be unchanged.

- [ ] T008 [US1] Stash or revert the uncommitted `navigation.js` changes and re-test T002. That edit extended `slideFromRight` to Profile, Map and three auth screens which previously used Android's default transition. **This is the cheapest possible test** and directly targets a recent regression
- [ ] T009 [US1] Make `slideFromRight` platform-aware in `navigation.js`. **Be clear on what this buys**: `@react-navigation/stack` animates in JS on *both* platforms, so this does not move the transition off the JS thread — only `native-stack` (US2) does that. What it saves is real but partial: `forHorizontalIOS` animates translateX plus an overlay opacity plus a card shadow, and shadow rendering is expensive on Android; the Android default animates fewer properties with no shadow. It is also a **visible change** — Android transitions will look native-Android rather than iOS. Confirm that is wanted before shipping. Implementation: keep `CardStyleInterpolators.forHorizontalIOS` on iOS and fall through to the platform default on Android by omitting `cardStyleInterpolator` there. `TransitionPresets.DefaultTransition` picks the correct per-platform preset if an explicit value is preferred
- [ ] T010 [US1] Re-measure T003's scenario against the baseline and record it in `specs/006-android-navigation-lag/follow-ups.md`. **If janky frames do not move, revert the `navigation.js` change from T009** — the fix has to earn its place
- [ ] T011 [US1] If T009 helps, evaluate `gestureResponseDistance: 200` (F7) in `navigation.js`. A 200px active pan region on every screen keeps a gesture-handler recogniser live over a large area on Android; try the default and measure
- [ ] T012 [US1] Confirm iOS transitions are unchanged — `forHorizontalIOS` must still apply there via `navigation.js`. Then commit with before/after numbers in the message

**Checkpoint**: Android uses platform-native transitions; iOS is untouched

---

## Phase 4: US2 — Migrate to `@react-navigation/native-stack` (Priority: P1)

**Goal**: The structurally correct fix. `@react-navigation/stack` animates transitions in JavaScript; `native-stack` delegates to native Fragments, which is why the JS stack is a known Android pain point.

**⚠️ This is the largest change in the plan** — 40 screens across 6 navigators, and the options API differs. Do it only if US1 does not resolve the lag, and prototype before committing to it.

**Independent test**: One migrated navigator's transitions, measured against T003.

- [ ] T013 [US2] Install `@react-navigation/native-stack` and add it to `package.json` (not currently a dependency). Confirm the version matches the `@react-navigation/native` major in use
- [ ] T014 [US2] **Prototype on one navigator only** — `AuthStack` in `navigation.js`, which is self-contained and has 15 screens. Do not migrate everything before measuring one
- [ ] T015 [US2] Map the options across for that navigator: `cardStyleInterpolator` has **no** native-stack equivalent — use `animation: "slide_from_right"`; `gestureDirection` becomes `gestureDirection` on native-stack with narrower support; `gestureResponseDistance` is `gestureResponseDistance` but numeric-only; `headerShown` is unchanged. Record every option that has no equivalent in `specs/006-android-navigation-lag/follow-ups.md`
- [ ] T016 [US2] Measure the `AuthStack` prototype in `navigation.js` against T003 and record it in `specs/006-android-navigation-lag/follow-ups.md`. **If native-stack does not beat the US1 fix, stop here** and do not migrate the remaining five navigators
- [ ] T017 [US2] If it wins, migrate `MainStack`, `ApprovalStack`, `TimeoutStack` and `OverlappingStack` in `navigation.js`, plus `HomeStack` in `src/screens/homenavigation.js`
- [ ] T018 [US2] Re-test every custom header in `navigation.js` — native-stack renders headers natively, so `headerRight`/`headerLeft` components behave differently. The `changeHeaderRight` call in `src/screens/entertainer.screen.js` sets `headerRight` via `navigation.setOptions` and is the highest-risk consumer
- [ ] T019 [US2] Verify the sticky-header scroll animation in `src/screens/location/location-view.screen.js` still works — it depends on the screen being inside a stack that does not clip it
- [ ] T020 [US2] Re-measure, record before/after in `specs/006-android-navigation-lag/follow-ups.md`, and commit the `navigation.js` and `src/screens/homenavigation.js` migration

---

## Phase 5: US3 — react-native-screens configuration (Priority: P2)

**Goal**: Inactive screens are being kept in the native hierarchy on 5 of 6 navigators. On Android that is retained memory and layout work during every transition.

**Independent test**: Memory after 10 push/pop cycles, and transition frame cost, against T003.

- [X] T021 [P] [US3] ~~Add `detachInactiveScreens={true}` to the five navigators in `navigation.js`~~ — **NO-OP, do not do this.** `@react-navigation/stack` v6.2.1 already defaults it to `true` on Android (`node_modules/@react-navigation/stack/lib/commonjs/views/Stack/CardStack.js:317`). The explicit prop on `src/screens/homenavigation.js:24` is redundant. Adding five more would be noise claiming a win that does not exist
- [ ] T022 [US3] Evaluate `freezeOnBlur: true` in each navigator's `screenOptions` in `navigation.js`. It stops React re-rendering blurred screens entirely. **Verify carefully**: a screen that polls or holds a subscription may stop updating in the background, which is a behaviour change, not just an optimization
- [ ] T023 [US3] Verify the `material-top-tabs` navigator in `src/screens/entertainer.screen.js` — it already sets `lazy: true`; confirm `lazy` is actually taking effect and consider `lazyPreloadDistance` given only 3 tabs
- [ ] T024 [US3] Re-measure transition cost and memory against T003, revert any `navigation.js` change that did not move a number, record in `specs/006-android-navigation-lag/follow-ups.md`, then commit

---

## Phase 6: US4 — What mounts during the transition (Priority: P2)

**Goal**: If T006 showed the lag survives with animation disabled, the destination screen's mount is the cost — not the navigator.

**Independent test**: Time from tap to interactive on the worst screen from T002.

- [ ] T025 [US4] Confirm the T006 result in `specs/006-android-navigation-lag/follow-ups.md` pointed here. **If disabling the animation removed the lag, skip this phase** — the cost is the transition, not the mount
- [ ] T026 [US4] Profile the mount of `src/screens/location/location-view.screen.js`. It mounts a `react-native-maps` `MapView` (`src/components/map/map.component.js:3`), a `Slideshow` and an `OfferList` in one pass. Android map surface creation is expensive and happens on the UI thread
- [ ] T027 [US4] Defer the `MapView` in `src/screens/location/location-view.screen.js` — render it only after the transition settles (`InteractionManager` is banned by `scripts/check-animation.sh`, so use a short `setTimeout`, an `onLayout` trigger, or `useIsFocused` from `@react-navigation/native`)
- [ ] T028 [US4] Apply the same deferral to any other heavy screen T026 names in `specs/006-android-navigation-lag/follow-ups.md`, then re-measure and commit

---

## Phase 7: US5 — React Navigation 6 → 7 (Priority: P3)

**Goal**: v6.0.10 predates New Architecture stabilisation and this app runs Fabric. v7 targets it directly.

**⚠️ Contingent.** Only if US1–US4 leave the app still laggy. A major navigator upgrade during a performance investigation adds a large uncontrolled variable.

- [ ] T029 [US5] Confirm from `specs/006-android-navigation-lag/follow-ups.md` that US1–US4 did not resolve the lag before starting. **If they did, close this phase**
- [ ] T030 [US5] Align the drifted v6 versions first in `package.json` — `native` 6.0.10, `stack` 6.2.1, `material-top-tabs` 6.6.14 are mismatched within the same major. This is cheap and may itself help
- [ ] T031 [US5] Read the v6 → v7 migration guide and record every breaking change that touches `navigation.js`, `src/screens/homenavigation.js` and `src/screens/entertainer.screen.js` in `specs/006-android-navigation-lag/follow-ups.md` before changing anything
- [ ] T032 [US5] Upgrade the `@react-navigation/*` versions in `package.json` and re-measure. Treat as its own release with a full regression pass, not a perf patch

---

## Phase 8: US6 — Navigator nesting depth (Priority: P3)

**Goal**: 4 levels of nesting means every parent navigator stays mounted beneath the visible screen.

**⚠️ Contingent and architectural.** Last resort.

- [ ] T033 [US6] Map the full nesting chain from `navigation.js` through `src/screens/entertainer.screen.js` to `src/screens/homenavigation.js` and record it in `specs/006-android-navigation-lag/follow-ups.md`
- [ ] T034 [US6] Identify whether `OverlappingStack` in `navigation.js` earns its level, or whether its screens can move into `MainStack`. Removing one level is the cheapest structural win
- [ ] T035 [US6] Re-measure after any flattening of `navigation.js`, record in `specs/006-android-navigation-lag/follow-ups.md`, and commit only if a number moved

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T036 Re-run the full T002 transition matrix from `specs/006-android-navigation-lag/follow-ups.md` on the release build and confirm every transition meets the target set in T003
- [ ] T037 Confirm the existing gates are still green: `npm run check:animation`, `npm run audit:lists`, `npm test` (27/27)
- [ ] T038 [P] Regression-test iOS across every navigator changed in `navigation.js`, `src/screens/homenavigation.js` and `src/screens/entertainer.screen.js`. Everything here risks changing iOS as a side effect
- [ ] T039 [P] Record the full before/after table in `specs/006-android-navigation-lag/follow-ups.md`: device, transition, metric, before, after, delta
- [ ] T040 Close out `specs/004-android-performance/follow-ups.md` — S2 is eliminated, and note whether the `004` skeleton and `removeClippedSubviews` changes should be kept, reverted, or re-measured now that a valid release baseline exists
- [ ] T041 Update the developer note with the outcome, summarising `specs/006-android-navigation-lag/follow-ups.md`, so the next person does not re-derive the JS-stack-vs-native-stack finding

---

## Dependencies

```
Phase 1 (T001-T005) ── reproduce + baseline
        │
        v
Phase 2 (T006-T007) ── animation vs mount   ◄── THE DECIDING EXPERIMENT
        │
        ├─ animation is the cost ──> US1 (T008-T012) 🎯 MVP
        │                              │ (insufficient?)
        │                              v
        │                            US2 (T013-T020)
        │                              │
        │                            US3 (T021-T024)
        │
        └─ mount is the cost ──────> US4 (T025-T028)
                                       │
                                       v
                              Phase 9 (T036-T041)
                                       │ (still laggy?)
                                       v
                          US5 (T029-T032) / US6 (T033-T035) ⚠️ contingent
```

**Hard dependencies**:
- T002/T003 (named transition + baseline) block every later measurement
- **T006 is the deciding experiment** — it routes the whole plan to either US1/US2 or US4
- T008 before T009 — test the revert before writing new code
- T016 gates T017–T020; do not migrate six navigators before measuring one
- T025 gates US4; T029 gates US5

**Soft ordering**: US3 is independent and can run alongside US1. US5 and US6 are last resorts.

**File collisions — never parallel**: T009, T011, T021 and T022 all touch `navigation.js`;
T014/T015/T017 touch it too.

## Parallel execution examples

**Phase 1**:
```
T004, T005   # iOS check and device recording are independent
```

**US3** — the one genuinely parallel fix phase:
```
T021   # navigation.js
T023   # src/screens/entertainer.screen.js
```

Most of this plan is **not** parallel: it is one experiment (T006) followed by whichever branch it
selects.

## Implementation strategy

**MVP scope**: T001–T012. Reproduce, run the deciding experiment, then test the cheapest fix — which
is also the one that most recently got worse. T008 alone is a `git stash` and a rebuild.

**Most likely outcome**: T006 shows the animation is the cost, US1 substantially fixes it, and US2
becomes an optional structural improvement rather than an emergency.

**The trap to avoid**: US2 (native-stack) is the "correct" answer and is tempting to start with. It
touches 40 screens, changes the options API, and would land in the middle of an unresolved
investigation. T014 exists to force a one-navigator prototype and a measurement before that
commitment.

**Carrying forward the lesson from 003/004**: every fix here is gated on a number moving. T010,
T016, T024, T035 all say revert if it did not.
