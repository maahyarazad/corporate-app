---
description: "Task list: static configuration for every remaining stack"
---

# Tasks: Static Configuration for All Stacks

**Input**: "add static configuration for all the stacks"

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/navigation-api.md`, `quickstart.md`

**Supersedes**: the original 47-task list, kept as `tasks.v1.md`. Its T001–T005 (aim check, branch,
baseline, dead dep, version alignment) and T006–T019 (v7 upgrade, `AuthStack` prototype) are carried
forward as the "Already done" section below. Renumbered because the remaining work is now
per-navigator rather than per-phase.

**Tests**: No automated test tasks. Nothing in the repo covers navigation. Verification is a device
pass per navigator plus the three existing gates, which are a floor rather than proof.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6
- Exact file paths in every task

---

## Already done (see `tasks.v1.md` and `follow-ups.md`)

- [X] Removed dead `@react-navigation/bottom-tabs` — commit `cf97c85`
- [X] Upgraded React Navigation 6 → 7 and added `native-stack` — commit `2c2d8de`
- [X] Converted `AuthStack` (15 screens) to static config — commit `e239115`
- [!] **Never run**: the `006` aim check, every device verification, and the measurement that
      decides whether native-stack is worth it at all

## ⚠️ Two things that are still true

**The aim check has not been run.** If the lag survives `animationEnabled: false`, the cost is the
destination screen's mount and native-stack will not fix it. This work would then be a
maintainability change, not a performance one — still worth doing, but do not expect a speedup.

**The v7 upgrade is unverified.** It touched every navigator, not just the converted one. Nothing
below should ship before `tasks.v1.md` T009–T011 (navigationRef, five root states, 53 custom
headers) pass on a device.

---

## Phase 1: Setup — the option translation table

**Purpose**: Every remaining navigator uses options native-stack does not have. Translate them once,
in one place, before converting anything.

- [X] T001 Audit the v6-only options in `navigation.js` and record the native-stack equivalent for each in `specs/007-static-navigation/follow-ups.md`. Confirmed present: `cardStyleInterpolator` (5), `detachPreviousScreen` (2), `headerLeftLabelVisible` (3), `headerBackTitleVisible` (2), plus `headerLeftContainerStyle` / `headerRightContainerStyle` in `entertainerScreenOptions` and `headerStyle: { shadowColor: "transparent" }` in `locationListOptions`
- [X] T002 Add the native-stack option constants to `navigation.js` alongside the existing v6 ones — do **not** edit the v6 constants in place, because navigators not yet converted still use them. Follow the `slideFromRightNative` precedent from commit `e239115`:
  - `revealFromBottomNative` — `cardStyleInterpolator: forVerticalIOS` → `animation: "slide_from_bottom"`
  - `plainBlackHeaderNative` — `forHorizontalIOS` → `animation: "slide_from_right"`; drop `headerBackTitleVisible`
  - `locationListOptionsNative` — `forVerticalIOS` → `animation: "slide_from_bottom"`; `headerStyle: { shadowColor: "transparent" }` → `headerShadowVisible: false`
  - `postDetailOptionsNative` / `postEntryOptionsNative` — drop `headerLeftLabelVisible`
- [X] T003 Record in `specs/007-static-navigation/follow-ups.md` that `keepPreviousScreenAttached` (`{ detachPreviousScreen: false }`) has **no native-stack equivalent** and must be dropped when `OverlappingStack` converts. Commit `7a1b9f4` added it to fix the Entertainer screen jolting on return — **flag that the jolt may come back**, and that this is the single most likely visible regression in the whole conversion
- [X] T004 Confirm `headerLeftContainerStyle` and `headerRightContainerStyle` in `entertainerScreenOptions` in `navigation.js`. The native header does not expose container styles; decide whether to absorb the padding into `renderEntertainerHeaderLeft` itself and record the decision

**Checkpoint**: Every option has a documented target or a documented removal

---

## Phase 2: Foundational — nothing blocks per-navigator work

**Purpose**: There is no shared prerequisite beyond Phase 1. Each navigator converts independently.

- [X] T005 Verify `createNativeStackNavigator` is imported in `navigation.js` (added in commit `e239115`) and add it to `src/screens/homenavigation.js`, which has not been touched yet

---

## Phase 3: US1 — TimeoutStack and ApprovalStack (Priority: P1) 🎯 MVP

**Goal**: The two simplest navigators, 5 screens total, no custom headers. Proves the pattern beyond `AuthStack` at almost no risk.

**Independent test**: Airplane mode reaches `noconnection`; an unapproved account reaches `RequestApproval` and can move through the approval screens.

- [X] T006 [US1] Convert `TimeoutStack` in `navigation.js` to static config — 1 screen, `noconnection` → `NoConnectionScreen`, options `noHeader`. Delete the now-unused `const TimeoutStack = createStackNavigator()`
- [X] T007 [US1] Convert `ApprovalStack` in `navigation.js` to static config — 4 screens: `RequestApproval` (`noHeader`), `AuthEditProfile` (`slideFromRightNative`), `Camera` (`slideFromRightNative`), `Logout` (`noHeader`). Delete the now-unused `const ApprovalStack = createStackNavigator()`
- [X] T008 [US1] Verify the route names in `navigation.js` are byte-identical to the JSX they replace by diffing mechanically, not by eye — the technique used in commit `e239115`. `"RequestApproval"`, `"AuthEditProfile"`, `"Camera"`, `"Logout"`, `"noconnection"`
- [!] T009 [US1] Device pass per `specs/007-static-navigation/quickstart.md` V3: both navigators push and pop, swipe-back works, and `Logout` still behaves identically in `ApprovalStack` and `MainStack` (it is registered in both)
- [!] T010 [US1] Commit both `navigation.js` navigators together — 5 screens is small enough to bisect as one unit

---

## Phase 4: US2 — OverlappingStack (Priority: P1)

**Goal**: 10 screens, the provider wrapper, and the imperative header. **The riskiest navigator in the app.**

**Independent test**: `quickstart.md` V3 plus the Entertainer header checks. Watch specifically for the return-jolt that `keepPreviousScreenAttached` was added to fix.

- [X] T011 [US2] Move the `<BottomSheetModalProvider>` wrapper from `OverlappingNavigator` in `navigation.js` into the static config's **`layout`** key, which exists for exactly this. Confirm the v7 `layout` signature against `node_modules/@react-navigation/core` before relying on it
- [X] T012 [US2] Convert `OverlappingStack` in `navigation.js` to static config — 10 screens: `Entertainer` (`entertainerScreenOptions`), `post-tabs` (`noHeader`), `post-detail` (`postDetailOptionsNative`), `post-entry` (`postEntryOptionsNative`), `post-search` (`revealFromBottomNative`), `notifications` (`slideFromRightNative`), `post-select-category` (`modalNoHeader`), `post-select` (`postSelectOptions`), `marketplace-details` and `magazine-details` (both `zurueckHeaderOptions`)
- [X] T013 [US2] Drop `screenOptions={keepPreviousScreenAttached}` from the converted `OverlappingStack` in `navigation.js` — `detachPreviousScreen` has no native-stack equivalent (T003)
- [!] T014 [US2] **Test the return jolt specifically.** Navigate Entertainer → `post-detail` → back, repeatedly. Commit `7a1b9f4` added `keepPreviousScreenAttached` to fix a visible jolt on return; if it reappears, native-stack's own screen retention did not replace it and this needs a different fix. Record the result in `specs/007-static-navigation/follow-ups.md`
- [!] T015 [US2] Verify `changeHeaderRight` in `src/screens/entertainer.screen.js` still works under a **native** header — it sets `headerRight` imperatively via `navigation.setOptions`. Greeting, search, map, bell and avatar must all still update on tab press (`contracts/navigation-api.md` C4)
- [!] T016 [US2] Verify the modal presentations declared in `navigation.js` still behave: `post-entry`, `post-select-category` and `post-select` all use `presentation: "modal"`, which native-stack supports but renders as a **native** modal — the dismiss gesture and backdrop differ from the JS version
- [!] T017 [US2] Verify `renderZurueckBack` and `renderPostSelectBack` custom back buttons in `navigation.js` still render and navigate in a native header
- [X] T018 [US2] Delete the now-unused `const OverlappingStack = createStackNavigator()` from `navigation.js` and commit

---

## Phase 5: US3 — MainStack (Priority: P1)

**Goal**: 10 screens, one nested navigator, and the one options object that cannot be static.

**Independent test**: `quickstart.md` V3, plus the `002` sticky header on Location View.

- [X] T019 [US3] Convert `MainStack` in `navigation.js` to static config — 10 screens. `Main` nests `OverlappingNavigator`; in static config a nested navigator is supplied as the `screen` value, so US2 must land first
- [X] T020 [US3] Handle `TransactionSummary` in `navigation.js`. Its options are the one inline object in the file because `title` reads `i18n` from `TranslationContext`, and static `options` cannot call hooks. Move the title into the screen with `navigation.setOptions` in a `useLayoutEffect` inside `src/screens/offer/transactionSummary.screen.js`, or leave this one screen's options as a function — record which and why in `specs/007-static-navigation/follow-ups.md`
- [!] T021 [US3] Verify `locationViewOptions` in `navigation.js` still works — it spreads `plainBlackHeader` and sets `headerTitle: () => <LocationViewTitle />`. A component title is supported by native-stack but centres and measures differently
- [!] T022 [US3] Verify the `002` sticky header in `src/screens/location/location-view.screen.js` still slides, clamps and pull-to-refreshes. It is driven by `useAnimatedScrollHandler` and is the most intricate screen in this navigator
- [!] T023 [US3] Verify `renderBackArrow` in `navigation.js`'s `locationListOptions` still renders inset with no label — `005`'s own tasks flagged this as its highest-risk change, and native-stack renders it in a native header now
- [!] T024 [US3] Verify the `Map` and `Profile` transitions declared in `navigation.js` — your earlier edit moved both onto `slideFromRight`, so both change behaviour again here
- [X] T025 [US3] Delete the now-unused `const MainStack = createStackNavigator()` from `navigation.js` and commit

---

## Phase 6: US4 — HomeStack and the tab navigator (Priority: P2)

**Goal**: The two navigators outside `navigation.js`.

**Independent test**: Home tab renders and navigates; the three tabs still swipe.

- [X] T026 [P] [US4] Convert `HomeStack` in `src/screens/homenavigation.js` to static config — 1 screen. Also delete its `detachInactiveScreens={true}`, which is redundant (`006/follow-ups.md`)
- [!] T027 [US4] Decide whether to convert the `material-top-tabs` navigator in `src/screens/entertainer.screen.js` to static config. It supports it — `createMaterialTopTabNavigator` uses the same `createNavigatorFactory` — but the tab list is currently **built from `useMemo` over `i18n`**, so the labels are dynamic. A static config cannot read context; the tab `name` would have to move to `options` set per screen. Record the decision in `specs/007-static-navigation/follow-ups.md` before changing anything
- [!] T028 [US4] If T027 says convert, do it in `src/screens/entertainer.screen.js` and verify all three tabs still swipe, the lazy loading still works, and `tabBarIcon` still receives `focused`. If it says leave it, close this task with the reason — a dynamic navigator inside a static tree is fine

---

## Phase 7: US5 — Retire the JS stack (Priority: P2)

**Goal**: Once every navigator is native-stack, `@react-navigation/stack` is dead weight.

**Independent test**: The app builds and runs with the dependency removed.

- [X] T029 [US5] Confirm no navigator imports `createStackNavigator`: `grep -rn "createStackNavigator" --include="*.js" navigation.js src` must return nothing
- [X] T030 [US5] Remove the now-unused `CardStyleInterpolators` import from `navigation.js`, and delete the v6 option constants left behind — `slideFromRight`, `revealFromBottom`, `plainBlackHeader`, `locationListOptions`, `postDetailOptions`, `postEntryOptions`, `keepPreviousScreenAttached` — once nothing references them
- [!] T031 [US5] **BLOCKED — scope discovery.** `@react-navigation/stack` cannot be removed: `src/screens/posts/postNavigation.screen.js:15` and `src/screens/profile/profile.screen.js:31` still use it. Neither was in the original survey. Convert both first — see `follow-ups.md`
- [ ] T032 [US5] Run the gates (`npm run check:animation`, `npm run audit:lists`, `npm test`) and a full device pass across all five root states, then commit

---

## Phase 8: US6 — `createStaticNavigation` at the root (Priority: P3) ⚠️ CONTINGENT

**Goal**: The last step of the requested snippet. **Optional** — everything above works without it.

**⚠️ This is the part that changes behaviour rather than syntax.** `createStaticNavigation` is
root-only, and `navigation.js` swaps between five navigators by state. Collapsing that into guarded
groups changes the back stack at every auth boundary (`research.md` R4).

**Independent test**: `quickstart.md` V5 — all five root states reach the right screens and the back
stack is correct at each boundary.

- [ ] T033 [US6] Extract `useAssets([...~80 requires...])` and its `useEffect` out of the nested `renderNavigator()` function in `navigation.js` — hooks in a non-component function, and impossible inside a static tree (`research.md` R5). Move into a component wrapping the navigator, or into the `expo-splash-screen` phase
- [ ] T034 [US6] Design the guarded-group structure in `specs/007-static-navigation/follow-ups.md` **before** writing code: five conditions (`noConnection`, `isOutdated`, authorized, approval, signed-out) become `groups` with `if` hooks per the static auth-flow docs. `VersionMismatchScreen` is currently returned bare, not inside a navigator, so it needs a home
- [ ] T035 [US6] Create the context and `if` hooks the groups need in `navigation.js` — the docs pattern is a context plus `useIsSignedIn` / `useIsSignedOut`; here it is five mutually-exclusive states, so name them for what they gate
- [ ] T036 [US6] Convert `navigation.js` to a single root config and wrap with `createStaticNavigation`, rendering `<Navigation ref={navigationRef} />` so `src/navigation/navigate.js` is untouched (`contracts/navigation-api.md` C1)
- [ ] T037 [US6] Verify **every** route name is still byte-identical (`contracts/navigation-api.md` C2). The static API infers types from config keys, which invites tidying; renaming any one silently breaks a push destination
- [ ] T038 [US6] Test back-stack behaviour at every boundary in `navigation.js`: signing in, signing out, losing connection, version mismatch. v7 unmounts screens whose guard goes false, which approximates but does not equal today's navigator swap
- [ ] T039 [US6] Verify push notifications (`src/screens/entertainer.screen.js`) and `gecmobile://` deep links (`src/utils/urlRouter.js`) still land correctly, then commit

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T040 Run all three gates: `npm run check:animation`, `npm run audit:lists`, `npm test` (27/27)
- [ ] T041 [P] Full iOS regression across `navigation.js`, `src/screens/homenavigation.js` and `src/screens/entertainer.screen.js` — native-stack changes both platforms
- [ ] T042 [P] Measure the converted app against `006`'s baseline and record device/transition/before/after/delta in `specs/007-static-navigation/follow-ups.md`. If nothing moved, say so and keep the work on its maintainability merits (`contracts/navigation-api.md` C7)
- [ ] T043 Update `specs/006-android-navigation-lag/follow-ups.md` with what this proved or refuted about F1/F2
- [ ] T044 Update the developer note with the outcome, summarising `specs/007-static-navigation/follow-ups.md`

---

## Dependencies

```
Phase 1 (T001-T004) option translation ── blocks every conversion
        │
        v
Phase 2 (T005)
        │
        ├──► US1 (T006-T010)  🎯 TimeoutStack + ApprovalStack
        │
        ├──► US2 (T011-T018)  OverlappingStack ── riskiest
        │         │
        │         v
        ├──► US3 (T019-T025)  MainStack (nests Overlapping, so US2 first)
        │
        └──► US4 (T026-T028)  HomeStack + tabs
                  │
                  v
             US5 (T029-T032)  retire @react-navigation/stack
                  │
                  v
             Phase 9 (T040-T044)
                  │ (static root actually wanted?)
                  v
             US6 (T033-T039) ⚠️ contingent
```

**Hard dependencies**:
- T002 blocks every conversion — nothing converts before its options have a target
- **T012 (US2) blocks T019 (US3)** — `MainStack`'s `Main` screen nests `OverlappingNavigator`, and a
  static nested navigator must exist before it can be referenced
- T029 gates T031 — do not remove the dependency while anything still imports it
- T033 blocks T036 — the asset gate must move before a static root is possible

**Soft ordering**: US1 and US4 are independent of everything else and of each other.

**File collisions — never parallel**: T002, T006, T007, T011, T012, T013, T018, T019, T025, T030,
T033, T036 all touch `navigation.js`. Only T026 (`homenavigation.js`) and T027 (`entertainer.screen.js`)
sit outside it.

## Parallel execution examples

```
T026   # src/screens/homenavigation.js
T027   # src/screens/entertainer.screen.js
```

That is genuinely all. `navigation.js` is one file touched by twelve tasks, so this is a
single-threaded migration — two people cannot split it without constant conflicts.

## Implementation strategy

**MVP scope**: T001–T010. The option translation table plus the two simplest navigators. Five
screens, no custom headers, and it proves the pattern generalises beyond `AuthStack`.

**Then**: US2 → US3 in that order (MainStack nests OverlappingStack), US4 whenever, US5 to clean up.

**Highest-risk single task**: **T014**. `keepPreviousScreenAttached` was added by commit `7a1b9f4`
specifically to stop the Entertainer screen jolting on return, and `detachPreviousScreen` has no
native-stack equivalent. If the jolt returns, that is a real regression traceable to this migration
and it needs its own fix, not a shrug.

**US6 is optional.** Everything through US5 delivers static configuration for all the stacks, which
is what was asked. `createStaticNavigation` at the root is a further step that changes behaviour at
every auth boundary for no runtime gain — worth doing only if the type inference and generated
linking config are wanted for their own sake.
