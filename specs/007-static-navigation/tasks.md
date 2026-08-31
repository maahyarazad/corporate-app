---
description: "Task list for the React Navigation v7 + native-stack + static API migration"
---

# Tasks: Static Navigation API + Native Stack

**Input**: Design documents from `/specs/007-static-navigation/`

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/navigation-api.md`, `quickstart.md`

**Tests**: No automated test tasks. The 27 Jest tests cover pure logic; nothing covers navigation,
and building a navigation harness is larger than this migration. Verification is per-navigator
device passes plus the three existing gates, which are a floor, not proof.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6
- Exact file paths in every task

## Read before starting

The requested snippet bundles **three independent migrations**, and only one can affect the Android
lag (`research.md` R1):

| | Fixes the lag? |
|---|---|
| v6 → v7 | No — prerequisite |
| `createNativeStackNavigator` | **Yes** |
| `createStaticNavigation` | **No — zero runtime effect** |

US1/US2 are the performance work. US4/US5 (the static API) are ergonomics and are **contingent**.

## Note on "user stories"

No `spec.md` — this is a migration. The six stories are the phases from `plan.md`, ordered so that
the piece that can move the number ships before the piece that cannot.

---

## Phase 1: Setup — confirm the aim, then align versions

**Purpose**: Make sure this migration is pointed at the real cause before spending 41 screens on it

- [!] T001 **AIM CHECK — do this first.** Run `006`'s T006: temporarily add `animationEnabled: false` to the `slideFromRight` constant in `navigation.js`, rebuild release, and repeat the slow transition. **If the lag persists with no animation at all, the cost is the destination screen's mount, not the transition — native-stack will not fix it.** Stop and work `006` US4 (the `MapView` in `src/components/map/map.component.js`) instead. Record the result in `specs/007-static-navigation/follow-ups.md`, then revert the temporary line
- [ ] T002 Create branch `007-static-navigation` from `005-static-screen-options`. Note `app.json` currently carries an uncommitted version bump — decide whether to commit or stash it
- [!] T003 Capture the `006` baseline numbers into `specs/007-static-navigation/follow-ups.md` — device, transition, janky-frame percentage. Without them nothing in US3 can be proven
- [X] T004 Remove `@react-navigation/bottom-tabs` from `package.json`. It has **zero imports** anywhere in the source (`research.md` R3) — do not carry it through a major upgrade
- [!] T005 Align the drifted v6 versions in `package.json` — `native` 6.0.10, `stack` 6.2.1, `material-top-tabs` 6.6.14, `elements` 1.3.31 are mismatched within one major. Then run `npm install`, `npm run check:animation`, `npm run audit:lists`, `npm test`, and a release build. **No behaviour should change**; if any does, stop and investigate before attempting v7

**Checkpoint**: Aim confirmed, versions aligned, baseline recorded

---

## Phase 2: Foundational — React Navigation 6 → 7

**Purpose**: Prerequisite for both native-stack (on v7) and the static API. **Blocks every story.**

**⚠️ Keep the dynamic JSX config unchanged in this phase.** Every navigator keeps
`createStackNavigator`. That isolates "the upgrade broke something" from "native-stack broke
something" — do not combine them.

- [ ] T006 Upgrade `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/material-top-tabs` and `@react-navigation/elements` to 7.x in `package.json`. `react-native-screens` 4.16.0 already satisfies v7's `>= 4.0.0`, so no native module change is needed (`research.md` R3)
- [ ] T007 Work through the v6 → v7 breaking changes against `navigation.js`, `src/screens/homenavigation.js` and `src/screens/entertainer.screen.js`, recording each one that applies in `specs/007-static-navigation/follow-ups.md` before changing code
- [ ] T008 Verify the `CommonActions` (4 uses) and `StackActions` (1 use) call sites across `src/` still resolve under v7 — locate them with `grep -rn "CommonActions\|StackActions" --include="*.js" src` and record each in `specs/007-static-navigation/follow-ups.md`
- [ ] T009 Rebuild release and verify `navigationRef` still resolves — `contracts/navigation-api.md` C1. Tap a push notification and follow a `gecmobile://` deep link. `src/navigation/navigate.js` is consumed from **75 call sites across 45 files** and fails silently when broken
- [ ] T010 Verify all five root states still render their navigator per `specs/007-static-navigation/quickstart.md` V2: normal launch, airplane mode (`TimeoutStack`), signed out (`AuthStack`), unapproved (`ApprovalStack`), signed in (`MainScreen`)
- [ ] T011 Verify all 53 custom header options in `navigation.js` and `src/` still render — they are still JS headers at this point, so anything broken here is an upgrade problem, not a native-stack one
- [ ] T012 Run the gates (`npm run check:animation`, `npm run audit:lists`, `npm test`) and commit

**Checkpoint**: v7 running with the dynamic config, behaviour unchanged

---

## Phase 3: US1 — native-stack prototype on AuthStack (Priority: P1) 🎯 MVP

**Goal**: Convert the simplest self-contained navigator, measure it, and decide whether the remaining five are worth doing. This is the whole bet of the feature, tested on 15 screens instead of 41.

**Independent test**: `quickstart.md` V3 on `AuthStack` only, plus a V4 measurement against the T003 baseline.

- [ ] T013 [US1] Install `@react-navigation/native-stack` at 7.x and add it to `package.json`. It is not currently a dependency
- [ ] T014 [US1] Convert `AuthStack` in `navigation.js` from `createStackNavigator` to `createNativeStackNavigator`. 15 screens, mostly `headerShown: false`, no imperative headers — the lowest-risk navigator in the app
- [ ] T015 [US1] Translate the `slideFromRight` constant in `navigation.js` per `contracts/navigation-api.md` C3: `cardStyleInterpolator: forHorizontalIOS` → `animation: "slide_from_right"`; `cardStyle` → `contentStyle`; `gestureResponseDistance` stays but must be a **number**, not an object; delete `detachPreviousScreen`. Record anything deliberately dropped in `specs/007-static-navigation/follow-ups.md`
- [ ] T016 [US1] Run `quickstart.md` V3 on `AuthStack` on **both** platforms: every screen pushes and pops, the swipe-back gesture works, and the `noSwipeBack` screens still block it
- [ ] T017 [US1] **Measure.** Release build, physical Android device, 10 push/pop cycles, `adb shell dumpsys gfxinfo com.buenapublica.GECRewards framestats`, median of 3 runs, compared against T003. Record in `specs/007-static-navigation/follow-ups.md`
- [ ] T018 [US1] **DECISION GATE.** If native-stack did not beat the JS stack on this navigator, **stop the migration here** and keep v7 on the dynamic API — `contracts/navigation-api.md` C7 forbids claiming a win without a number. If it did, continue to US2
- [ ] T019 [US1] Commit the `navigation.js` `AuthStack` conversion alone, with the T017 before/after numbers from `specs/007-static-navigation/follow-ups.md` in the message

**Checkpoint**: One navigator converted and measured; the bet is proven or abandoned

---

## Phase 4: US2 — native-stack on the remaining navigators (Priority: P1)

**Goal**: Convert the other five stacks. **One navigator per commit** — a 41-screen commit cannot be bisected when a header regresses (`contracts/navigation-api.md` C5).

**Independent test**: `quickstart.md` V3 per navigator, on both platforms.

- [ ] T020 [US2] Convert `TimeoutStack` in `navigation.js` (1 screen). Trivial; do it second to build confidence cheaply
- [ ] T021 [US2] Convert `HomeStack` in `src/screens/homenavigation.js` (1 screen), and delete its now-redundant `detachInactiveScreens` — `@react-navigation/stack` already defaulted it to `true` on Android and native-stack manages it itself (`006/follow-ups.md`)
- [ ] T022 [US2] Convert `ApprovalStack` in `navigation.js` (4 screens)
- [ ] T023 [US2] Convert `MainStack` in `navigation.js` (10 screens). Includes Profile and Map, which your recent edit moved onto `slideFromRight` — verify both transitions
- [ ] T024 [US2] Convert `OverlappingStack` in `navigation.js` (10 screens). **Highest risk** — it hosts `Entertainer`, which owns the imperative header
- [ ] T025 [US2] Verify `changeHeaderRight` in `src/screens/entertainer.screen.js` still works under a native header. It sets `headerRight` through `navigation.setOptions`; the greeting, search icon, map icon, notification bell and avatar must all still update on tab press (`contracts/navigation-api.md` C4)
- [ ] T026 [US2] Verify the `002` sticky header in `src/screens/location/location-view.screen.js` still slides, clamps and pull-to-refreshes. It is driven by `useAnimatedScrollHandler` and lives inside `MainStack`
- [ ] T027 [US2] Walk all 53 custom header options across `navigation.js` and `src/` per `contracts/navigation-api.md` C4: `headerTitle` (26) centres and truncates acceptably at its longest realistic value, `headerLeft` (18) still navigates back, `headerRight` (9) renders
- [ ] T028 [US2] Confirm `src/screens/entertainer.screen.js`'s `material-top-tabs` navigator is **not** converted — there is no native-stack equivalent for a swipeable pager, and it is already backed by native `react-native-pager-view`
- [ ] T029 [US2] Remove `@react-navigation/stack` from `package.json` once no navigator imports it, and confirm with `grep -rn "createStackNavigator" --include="*.js" src navigation.js`

---

## Phase 5: US3 — Prove it (Priority: P2)

**Goal**: The measurement that justifies the whole feature.

**Independent test**: `quickstart.md` V4 against the T003 baseline.

- [ ] T030 [US3] Re-run the full transition matrix from `specs/006-android-navigation-lag/tasks.md` T002 on a release build: Entertainer → `post-detail`, Entertainer → Profile, Home → `LocationList`, `LocationList` → `Location View`
- [ ] T031 [US3] Measure each with `adb shell dumpsys gfxinfo com.buenapublica.GECRewards framestats`, median of 3 runs, device cooled between runs, and record device/transition/before/after/delta in `specs/007-static-navigation/follow-ups.md`
- [ ] T032 [US3] Verify on iOS that transitions across `navigation.js` did **not** regress, recording the result in `specs/007-static-navigation/follow-ups.md`. native-stack changes both platforms; Android is the motivation, iOS is the risk
- [ ] T033 [US3] If the numbers did not move, say so plainly in `specs/007-static-navigation/follow-ups.md` and keep or revert the migration on its maintenance merits — but make **no** performance claim (`contracts/navigation-api.md` C7)

**Checkpoint**: The feature's premise is confirmed or refuted with numbers

---

## Phase 6: US4 — Static API prerequisite: extract the asset preload (Priority: P3) ⚠️ CONTINGENT

**Goal**: `createStaticNavigation` cannot contain the asset gate that currently wraps the navigator tree. This must land before US5 is possible.

**⚠️ Only start if the static API is actually wanted.** It has zero runtime effect (`research.md` R1). US1–US3 deliver the performance work without it.

**Independent test**: The app still shows the splash until assets resolve, and no navigator renders early.

- [ ] T034 [US4] Extract `useAssets([...])` and its `useEffect` out of the nested `renderNavigator()` function in `navigation.js`. They are hooks inside a non-component function, legal today only because it is invoked exactly once per render — fragile, and impossible inside a static tree (`research.md` R5)
- [ ] T035 [US4] Move the preload out of `navigation.js` into a component wrapping the navigator, or into the `expo-splash-screen` phase (`expo-splash-screen` is already a dependency). ~80 `require()` calls resolving before the first screen renders is a startup cost worth moving regardless
- [ ] T036 [US4] Verify the splash still displays until assets resolve and no navigator in `navigation.js` mounts early, then commit

---

## Phase 7: US5 — Static API: collapse the root switch (Priority: P3) ⚠️ CONTINGENT

**Goal**: `createStaticNavigation` takes **one** tree. `navigation.js` currently swaps between **five** navigators by state. This is a design change, not a syntax conversion.

**⚠️ The highest-risk work in the feature and the least valuable.** It changes back-stack behaviour at every auth boundary for no runtime gain.

**Independent test**: `quickstart.md` V5 — all five root states reach the right screens, and the back stack is correct at each boundary.

- [ ] T037 [US5] Map the five root states in `navigation.js` (`!assets`, `noConnection`, `isOutdated`, `authorized`, `approval`, `auth`) onto `if`-guarded groups within one `createNativeStackNavigator` config, and write the design into `specs/007-static-navigation/follow-ups.md` **before** writing code (`research.md` R4)
- [ ] T038 [US5] Convert `navigation.js` to the static config and wrap it with `createStaticNavigation`, passing the existing ref as `<Navigation ref={navigationRef} />` so `src/navigation/navigate.js` is untouched (`contracts/navigation-api.md` C1)
- [ ] T039 [US5] Verify every route name is byte-identical — `"Location View"`, `"Event Detail"`, `"post-detail"`, `"LocationList"`, `"Map"`, `"Profile"`, `"notifications"`, `"post-search"`. The static API infers types from config keys, which is a tempting moment to tidy names; renaming any one silently breaks a push destination (`contracts/navigation-api.md` C2)
- [ ] T040 [US5] Test **back-stack behaviour at every boundary** of the guarded groups in `navigation.js`: signing in, signing out, losing connection, and the version-mismatch path. v7 unmounts screens whose group guard goes false, which approximates but does not equal today's navigator swap. This is the behaviour most likely to change
- [ ] T041 [US5] Verify push notifications (`src/screens/entertainer.screen.js`) and `gecmobile://` deep links (`src/utils/urlRouter.js`) still land correctly, then commit

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T042 Run all three gates: `npm run check:animation`, `npm run audit:lists`, `npm test` (27/27)
- [ ] T043 [P] Full iOS regression across every navigator changed in `navigation.js`, `src/screens/homenavigation.js` and `src/screens/entertainer.screen.js`
- [ ] T044 [P] Record the final before/after table in `specs/007-static-navigation/follow-ups.md`: device, transition, metric, before, after, delta
- [ ] T045 Consider generating a `linking` config from the screen tree now that route structure is declarative, and compare it against the manual handling in `src/utils/urlRouter.js` — which still has no cold-start `getInitialURL` handling. Record as a follow-up; do not implement here
- [ ] T046 Close out `specs/006-android-navigation-lag/follow-ups.md` with what this migration proved or refuted about F1/F2
- [ ] T047 Update the developer note, summarising `specs/007-static-navigation/follow-ups.md`, so the next person does not re-derive the "static API is not a performance fix" finding

---

## Dependencies

```
T001 AIM CHECK ──► lag persists without animation? ──► STOP, work 006 US4 instead
   │
   │ (lag is the transition)
   v
Phase 1 (T002-T005) ──► Phase 2 (T006-T012) v6→v7, dynamic config unchanged
                              │
                              v
                        US1 (T013-T019)  🎯 AuthStack prototype
                              │
                        T018 DECISION GATE ──► no improvement? ──► STOP, keep dynamic v7
                              │
                              v
                        US2 (T020-T029) remaining 5 navigators
                              │
                              v
                        US3 (T030-T033) prove it
                              │
                              v
                     Phase 8 (T042-T047)
                              │
                              │ (static API actually wanted?)
                              v
                US4 (T034-T036) ──► US5 (T037-T041)  ⚠️ contingent
```

**Hard dependencies**:
- **T001 gates the entire feature.** If the mount is the cost, none of this helps
- T006 (v7) blocks every story
- **T018 is a stop gate** — do not convert five more navigators on an unmeasured prototype
- T034 blocks T037; the asset gate must move before a static tree is possible
- T013 blocks T014; T015 blocks T016

**Soft ordering**: US2's navigators are independent of each other, but each is its own commit.
US4/US5 are contingent on wanting the static API at all — US1–US3 deliver the performance work
without them.

**File collisions — never parallel**: T014, T015, T020, T022, T023, T024, T029, T034, T038 all touch
`navigation.js`. Almost nothing in this migration parallelises.

## Parallel execution examples

**Phase 1**:
```
T003, T004   # baseline capture and dependency removal are independent
```

**Phase 8**:
```
T043, T044   # iOS regression and results write-up
```

That is the extent of it — `navigation.js` is a single file touched by most tasks, so this migration
is inherently sequential. Two people cannot usefully split it.

## Implementation strategy

**MVP scope**: T001–T019. Aim check, version alignment, v7 upgrade, one converted navigator, one
measurement, one decision. That is the smallest slice that answers "is native-stack the fix?" — and
it does so on 15 screens rather than 41.

**Most likely outcome**: T001 confirms the transition is the cost, US1 shows a real improvement, US2
converts the rest, and US4/US5 are never done because the static API's benefits (inferred types,
generated linking config) do not justify collapsing a five-way root switch.

**The trap this ordering avoids**: the requested snippet leads with `createStaticNavigation`, which
is the largest, riskiest and least valuable third of the work. Doing it first would spend the whole
budget before anything measurable changed — and if the lag persisted, there would be no way to tell
whether the renderer swap would have fixed it.

**Carrying forward the lesson from 003/004**: T018 and T033 both say stop or revert if the number
does not move.
