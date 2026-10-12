---
description: "Task list for diagnosing and fixing the Android performance regression"
---

# Tasks: Android Performance Regression

**Input**: Design documents from `/specs/004-android-performance/`

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/performance-budget.md`, `quickstart.md`

**Tests**: No automated test tasks. There is no performance harness in this repo and building one is
out of scope. Verification is device measurement per `quickstart.md`, held to the budgets in
`contracts/performance-budget.md`. The three existing gates (`check:animation`, `audit:lists`,
`npm test`) must stay green throughout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which suspect this task serves (US1–US6)
- Exact file paths in every task

## ⚠️ This is a diagnostic plan, not a fix list

**Do not start at Phase 3.** Phases 1 and 2 decide which of US1–US6 is real. The regression this
branch exists to correct was itself caused by applying plausible-sounding optimizations without
measuring, and repeating that here would make the cause harder to find, not easier.

**T003 is a stop gate**: if the lag disappears in a release build, close the report and do nothing
else.

## Note on "user stories"

There is no `spec.md` — this is a regression investigation. The six stories below are the **suspects**
from `data-model.md`, ordered by strength of mechanism. Each is independently testable against a
specific measurement, and most will turn out not to be the cause. That is the point.

---

## Phase 1: Setup — establish the measurement

**Purpose**: Make every later claim falsifiable, and rule out the highest-prior explanation first

- [X] T001 Create branch `004-android-performance` from `003-flatlist-optimization`. Leave the uncommitted `app.json`, `navigation.js` and `src/screens/entertainer.screen.js` changes in the working tree alone — they are unrelated to this investigation
- [!] T002 **BLOCKED — no adb, no device in this environment.** Prepare the reference device per `specs/004-android-performance/quickstart.md` §Prerequisites: a **physical mid-range Android device** (not an emulator), USB debugging on, `adb devices` showing exactly one device, fixed screen brightness, battery saver off
- [!] T003 **BLOCKED — needs a device. THIS IS THE NEXT ACTION.** **STOP GATE — measurement M1.** Build and run release: `npx expo run:android --variant release`, then repeat whatever felt laggy. **If the lag is gone, it was a debug build** (`research.md` R2): record that in `specs/004-android-performance/follow-ups.md` and close this branch. Do not proceed. Only continue to T004 if the lag reproduces in release
- [!] T004 Capture the M3 baseline on the release build: open a location detail via `src/screens/location/location-view.screen.js`, let it finish loading, touch nothing, then `adb shell dumpsys gfxinfo com.buenapublica.GECRewards reset`, wait 10s, and capture `framestats`. Median of 3 runs, device cooled between runs (`contracts/performance-budget.md` C3)
- [!] T005 [P] Capture the M4 scrolling baseline (30s on an image-heavy list) and the M5 heap baseline (10 location screens visited then popped, GC forced) per `specs/004-android-performance/quickstart.md`
- [!] T006 [P] Capture the same M3/M4/M5 numbers from `specs/004-android-performance/quickstart.md` on `master` as a known-good reference, so "regressed" is a measured delta rather than an impression

**Checkpoint**: Release build confirmed laggy; baselines recorded on both branches

---

## Phase 2: Foundational — name the commit

**Purpose**: Convert suspicion into evidence. **Blocks every fix phase.**

**⚠️ Do not skip this in favour of fixing US1 on the strength of its mechanism.** The mechanism for
S1 is strong, but "strong mechanism, no measurement" is exactly what shipped this regression.

- [X] T007 Choose one bisect scenario that can be judged consistently and exercises S1, S3 and S5 together — opening a location detail from `src/screens/location/location-view.screen.js` and scrolling it is the recommended choice. Write the exact steps into `specs/004-android-performance/quickstart.md` so every bisect step runs identically
- [!] T008 Run `git bisect start; git bisect bad 003-flatlist-optimization; git bisect good master`, rebuilding release at each step and judging with the T007 scenario. ~15 commits across `002`/`003`, so roughly 4 rebuilds
- [!] T009 Record the named commit in `specs/004-android-performance/follow-ups.md`, then `git bisect reset`. If the bisect is inconclusive because every commit feels equally slow, say so explicitly rather than picking one — that outcome points at S2 or at something outside these branches
- [!] T010 Map the named commit to its suspect using the table in `specs/004-android-performance/data-model.md`. `38f691b` → US1/US3; `01910b4` → US4; anything else → re-read the suspect list before proceeding

**Checkpoint**: A commit is named, or the bisect is documented as inconclusive

---

## Phase 3: US1 — Skeleton worklets that never stop (Priority: P1) 🎯 MVP

**Goal**: Stop nine per-frame worklets running forever behind a `display: none` skeleton on every location screen.

**Independent test**: M3 — a fully-loaded location screen, untouched, must show **< 1% janky frames** (`contracts/performance-budget.md` C2). That row is the decisive one: if the T004 baseline was already under 1%, **this suspect is wrong** — skip to US3 and do not "fix" it.

- [!] T011 [US1] Confirm S1 against the T004 baseline before changing anything. `src/components/skeletonLocation.js:11` hides with `display: display ? "flex" : "none"` so the subtree never unmounts, and `src/components/skeleton.js:26` starts `withRepeat(..., -1)` in a `[]` effect whose `cancelAnimation` cleanup therefore never runs. Nine `<Skeleton>` children means nine per-frame worklet evaluations on a static screen
- [X] T012 [US1] Add a visibility prop to `src/components/skeleton.js` (e.g. `animating`, defaulting to `true` so no existing caller changes) and gate the loop on it: start `withRepeat` only when visible, and call `cancelAnimation(opacity)` when it goes false. Preferred over unmounting because it cannot shift layout — `research.md` R7
- [X] T013 [US1] Fix the stale dependency array in the same effect in `src/components/skeleton.js`: it currently declares `[]` while reading `opacityMin` and `opacityMax`. Add them alongside the new visibility prop (`contracts/performance-budget.md` C4 corollary)
- [X] T014 [US1] Pass `display` through to every `<Skeleton>` child in `src/components/skeletonLocation.js` so the nine children stop when the wrapper is hidden. Keep the `display`/`backgroundColor` props unchanged — `contracts/performance-budget.md` C5
- [X] T015 [P] [US1] Audit the other skeleton wrappers for the same hide-don't-unmount pattern: `src/components/locationcards.js` and any `SkeletonLocations`/`SkeletonTags` used from `src/features/locations/components/locationlist.component.js` and `src/screens/specials.screen.js`. Apply the same gating where found; record any that already unmount correctly
- [!] T016 [US1] Re-measure M3 on the release build and compare against the T004 baseline. **If janky frames did not move, revert T012–T015** — a fix that does not move its metric is reverted, not kept (`contracts/performance-budget.md` C1)
- [!] T017 [US1] Verify `src/components/skeletonLocation.js` still *looks* correct during genuine loading: a stopped animation must not leave a half-faded skeleton frozen on screen. Check on both a fast and a throttled network
- [!] T018 [US1] Spot-check iOS — `src/components/skeleton.js` is shared, not Android-only. Then commit

**Checkpoint**: A static, loaded screen costs ~nothing on the UI thread

---

## Phase 4: US2 — Unbounded notification id set (Priority: P1)

**Goal**: Remove a real, if small, unbounded-growth leak so it stops muddying the leak-vs-CPU signal.

**Fix regardless of measurement.** ~3 lines, and it is the only confirmed unbounded collection in the app.

**Independent test**: M5 — heap growth over 10 screen visits stays under 5 MB, and the set's size no longer grows monotonically across a session.

- [~] T019 [US2] Cap `handledNotificationIds` in `src/screens/entertainer.screen.js:146`. It is a `Set` that is added to and never pruned (`research.md` R4). Keep only the most recent N ids (N ≈ 50 is ample — it exists solely to de-duplicate a cold-start replay against the live listener) or clear it on a timer
- [~] T020 [US2] Confirm the de-duplication still works after capping: a single notification tap must still produce exactly one navigation on a cold start, where `getLastNotificationResponseAsync` and the live listener both fire. That guarantee is the whole reason the set exists — see the comment at `src/screens/entertainer.screen.js:143`
- [~] T021 [US2] Record in `specs/004-android-performance/follow-ups.md` that `src/components/cacheImage.js:107`'s `inFlight` Map is **not** a leak — `forget()` at line 137 deletes on settle — so nobody re-flags it. Then commit

---

## Phase 5: US3 — CacheImage shimmer (Priority: P2)

**Goal**: Same engine change as US1, but bounded by visible rows rather than unbounded. Only act if measurement names it.

**Independent test**: M4 — frame cost must **recover when scrolling stops**. Sustained cost on a still list points at shimmers running behind loaded images.

- [ ] T022 [US3] Measure M4 on the release build per `specs/004-android-performance/quickstart.md`, watching specifically whether UI-thread cost persists after scrolling stops. If it drops to baseline, **US3 is not the cause** — close this phase and move on
- [ ] T023 [US3] If confirmed: stop the shimmer once the image has loaded in `src/components/cacheImage.js:44-58`, rather than leaving `withRepeat(..., -1)` running behind a loaded image. Cheaper and more targeted than reverting the engine
- [ ] T024 [US3] Verify the existing unmount cleanup still holds in `src/components/cacheImage.js` — `cancelAnimation(shimmer)` must still run when a row leaves the list, which is what bounds this suspect's exposure
- [ ] T025 [US3] Re-measure M4 per `specs/004-android-performance/quickstart.md` and compare against the T005 baseline; revert the `src/components/cacheImage.js` change if the number did not move
- [ ] T026 [US3] Commit, recording the before/after numbers in the commit message per `contracts/performance-budget.md` C1

---

## Phase 6: US4 — Heavy content in the converted ScrollView (Priority: P2)

**Goal**: Only real if the bisect named `01910b4`. The pre-analysis says it probably changed nothing.

**Independent test**: M3/M4 on `src/screens/location/location-view.screen.js` before and after reverting that commit.

- [ ] T027 [US4] Check whether T009 named `01910b4`. **If not, close this phase without changes.** `research.md` R3 establishes that the converted `Animated.FlatList` had no `data`, rendered exactly one footer, and that RN 0.81 no longer defaults `removeClippedSubviews` on Android — so there was no virtualization to lose
- [ ] T028 [US4] If named: measure the cost of the eagerly-mounted `react-native-maps` `MapView` in `src/components/map/map.component.js:3`, reached via `renderPartner` in `src/screens/location/location-view.screen.js`. Android map surfaces are expensive and do not clip themselves
- [ ] T029 [US4] If the map is the cost, mount it lazily — render the `Map` in `src/screens/location/location-view.screen.js` only once it is near the viewport, rather than reverting the ScrollView conversion. Reverting would restore two VirtualizedLists that render no list
- [ ] T030 [US4] Re-measure M3 on that screen and verify the `002` sticky header still slides, clamps and pull-to-refreshes (quickstart A2–A4 of `specs/003-flatlist-optimization/quickstart.md`), then commit

---

## Phase 7: US5 — toppartners memo churn (Priority: P3)

**Goal**: Confirm whether the memoization added in `003` actually holds, or misses on every render.

**Independent test**: React DevTools profiler on the home screen — location cards must not re-render on unrelated parent state changes.

- [ ] T031 [US5] Profile the home screen with React DevTools and check whether `MemoizedLocationCard` in `src/features/home/components/toppartners.component.js` actually hits. Both `groupLabels` and `renderGroup` depend on `topPartnersData`
- [ ] T032 [US5] If it misses: `topPartnersData` originates as `useState([])` at `src/screens/home.screen.js:123` and is passed to `<TopPartners>` at line 295. Check whether its identity is recreated per render. The fix belongs at the source, not at the consumer
- [ ] T033 [US5] Memoize `topPartnersData` where it is created in `src/screens/home.screen.js`, so every consumer benefits rather than each one working around it
- [ ] T034 [US5] Re-profile `src/features/home/components/toppartners.component.js` to confirm the cards stop re-rendering, then commit

---

## Phase 8: US6 — Broader Android hygiene (Priority: P3) ⚠️ CONTINGENT

**Goal**: The user asked to "check all the available optimization for android devices". These are the checked candidates.

**⚠️ This phase only runs if Phase 9 shows the app still misses budget after the confirmed fix.** If US1–US5 resolved the lag, these stay recorded findings and **no code changes**. Applying an unmeasured optimization checklist is what caused this regression (`plan.md` Constitution Check, conditional gate).

- [ ] T035 [US6] Confirm against `contracts/performance-budget.md` C2 whether the app still misses budget after Phase 9. **If it meets budget, mark T036–T041 as not-needed and close this phase**
- [ ] T036 [P] [US6] Enable `enableProguardInReleaseBuilds=true` in `android/gradle.properties`. Affects APK size and cold start, **not** frame rate — it will not fix this lag. Needs its own full regression pass, since R8 can strip code reflection-based libraries need
- [ ] T037 [P] [US6] Trim `reactNativeArchitectures` in `android/gradle.properties:31` from `armeabi-v7a,arm64-v8a,x86,x86_64` for release builds only. Halves APK size, no runtime effect on real devices. **Keep x86 for the dev profile** or emulators break
- [ ] T038 [US6] Only if profiling names a specific long list, add `removeClippedSubviews` to that list's `<FlatList>` (candidates are inventoried in `specs/003-flatlist-optimization/data-model.md`). `003` deliberately declined this for known blank-cell bugs on Android — reversing that needs a named list and a measurement, not a blanket application
- [ ] T039 [US6] Re-evaluate `getItemLayout` for any list whose rows now have a **declared** fixed height. `003/follow-ups.md` F7 declined it because no candidate declared one; that finding stands unless a row's StyleSheet changed
- [ ] T040 [US6] Re-evaluate FlashList for the three paginated lists (`src/screens/posts/posts.screen.js`, `src/screens/posts/postSearch.screen.js`, `src/features/locations/components/locationlist.component.js`) — only if profiling proves `FlatList` is the bottleneck. New native dependency plus a prebuild
- [ ] T041 [US6] Record every candidate **not** applied, with the measurement that would justify it, in `specs/004-android-performance/follow-ups.md`. A rejected optimization with a stated trigger is more useful than an unexplained omission

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T042 Re-measure M3, M4 and M5 on the release build and check every row of `contracts/performance-budget.md` C2. Median of 3 runs, device cooled between (C3)
- [ ] T043 Confirm the three gates are still green: `npm run check:animation`, `npm run audit:lists`, `npm test` (27/27) — `contracts/performance-budget.md` C6
- [ ] T044 If the US1 fallback was taken (reverting `src/components/skeleton.js` to RN `Animated`), add an explicit documented exemption to `scripts/check-animation.sh` rather than silently weakening its pattern
- [ ] T045 [P] Spot-check iOS across every touched component — `src/components/skeleton.js`, `src/components/skeletonLocation.js` and `src/components/cacheImage.js` are shared, not Android-only
- [ ] T046 [P] Record the full before/after table in `specs/004-android-performance/follow-ups.md`: device, build variant, scenario, metric, before, after, delta — for every fix that shipped
- [ ] T047 Add the C4 rule ("nothing animates while invisible") to the developer note and to `specs/003-flatlist-optimization/contracts/list-api.md`, so the next person writing a `withRepeat(..., -1)` does not repeat this
- [ ] T048 Update the PR descriptions for #53 and #54 (bodies drafted from `specs/002-reanimated-migration/plan.md` and `specs/003-flatlist-optimization/plan.md`) if either commit is reverted or amended, so the stack's history stays accurate

---

## Dependencies

```
Phase 1 (T001-T006)  ──> T003 STOP GATE
                            │ (lag reproduces in release)
                            v
Phase 2 (T007-T010)  ── names the commit
                            │
        ┌───────────────────┼───────────────────┬──────────────┐
        v                   v                   v              v
   US1 (T011-T018)     US3 (T022-T026)    US4 (T027-T030)  US5 (T031-T034)
   🎯 MVP                                                        
        │                                                        
   US2 (T019-T021) ── independent, fix regardless               
        │                                                        
        └───────────────────┬───────────────────────────────────┘
                            v
                   Phase 9 (T042-T048)
                            │ (still misses budget?)
                            v
                   US6 (T035-T041) ⚠️ contingent
```

**Hard dependencies**:
- **T003 gates everything.** A debug build invalidates every later measurement
- T004/T005 (baselines) block T016, T022, T025, T042 — no before, no verifiable after
- T009 (named commit) gates T027; US4 does nothing unless the bisect names `01910b4`
- T012 blocks T013 and T014 (same component contract); T011 must precede T012
- T035 gates T036–T041 — the whole of US6 is contingent on Phase 9
- Phase 9 requires whichever fix phases actually ran

**Soft ordering**: US2 is independent of the bisect and can run at any time. US1, US3, US4, US5 are
mutually independent once Phase 2 names a commit — but in practice **only one of them is the cause**,
so expect to close most of them with a measurement rather than a fix.

**File collisions — never parallel**:
- T012, T013 and T015 all touch `src/components/skeleton.js`
- T014 and T015 both touch skeleton wrappers
- T023 and T024 both touch `src/components/cacheImage.js`

## Parallel execution examples

**Phase 1** — after T003 passes:
```
T005, T006   # different measurement runs, can be split across two devices
```

**Across suspects** — after Phase 2, if the bisect is ambiguous and several need testing:
```
Dev A: US1 (T011-T018)   # the prime suspect, needs the most care
Dev B: US2 (T019-T021)  →  US5 (T031-T034)
Dev C: US3 (T022-T026)  →  US4 (T027-T030)
```

In the likely case that the bisect names one commit cleanly, this is **not** parallel work — it is
one fix and several closed suspects.

## Implementation strategy

**MVP scope**: T001–T003. If the app was being measured in a debug build, that is the entire fix and
the remaining 45 tasks are unnecessary. This is the highest-value three tasks in the plan precisely
because they can end it.

**Most likely real scope**: T001–T018 plus T042–T046 — release confirmed, bisect names `38f691b`,
US1 fixed and measured, everything else closed with a measurement.

**Incremental delivery**: every fix is one commit with its before/after numbers in the message. A fix
whose metric did not move is reverted in the same session, not carried forward hopefully.

**The discipline that matters here**: most of these tasks should end in "measured, not the cause,
closed" rather than a code change. Resist converting a suspect into a fix because the mechanism
sounds convincing — that is the specific mistake that produced this regression.
