---
description: "Task list for migrating React Native Animated → Reanimated"
---

# Tasks: Migrate RN `Animated` → Reanimated

**Input**: Design documents from `/specs/002-reanimated-migration/`

**Prerequisites**: `plan.md`, `research.md`, `data-model.md`, `contracts/animation-api.md`, `quickstart.md`

**Tests**: No automated test tasks. Per `research.md` R6, Reanimated animation behaviour is not
assertable in this repo's Jest setup (no RN testing-library, `jest-expo` installed but
unconfigured, no jest config at all). Verification is the `check:animation` gate plus the scripted
device sweep in `quickstart.md`. Building a Reanimated test harness is explicitly out of scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which work stream this task belongs to (US1–US7)
- Exact file paths included in every task

## Note on "user stories"

There is no `spec.md` for this feature — it is a mechanical refactor, not a user-facing change
(see `plan.md` §Branch Note). The seven "stories" below are the **pattern classes** from
`data-model.md`. Each is a coherent, independently shippable, independently testable increment
with its own sweep scenarios, which is exactly the property the template's story grouping is for.
Priorities reflect risk-ordering from `research.md` R7, not user value.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a trustworthy baseline before changing a single animation

- [X] T001 Create branch `002-reanimated-migration` from `master` and confirm a clean tree via `git status`
- [X] T002 Verify New Architecture is active on both platforms: confirm `newArchEnabled=true` in `android/gradle.properties` (already present) and confirm Fabric is active on iOS at runtime — `ios/Podfile.properties.json` has no explicit flag and relies on the Expo SDK 54 default. Reanimated 4 requires it; abort the migration if it is off
- [X] T003 Record the `npm test` baseline result in `specs/002-reanimated-migration/quickstart.md` under "Baseline capture" so a pre-existing failure is never attributed to this refactor (`jest-expo` is installed but there is no jest config)
- [ ] T004 Capture baseline screen recordings on a physical iOS and Android device for every scenario in `specs/002-reanimated-migration/quickstart.md` §Sweep. **Blocking** — without a before, "looks identical" cannot be verified

**Checkpoint**: Baseline captured, New Architecture confirmed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Guardrails, dead-code removal, and the shared hook that Phase 3 depends on

**⚠️ CRITICAL**: T007 blocks US1. T005 must land before any conversion so the gate meaningfully fails-then-passes

- [X] T005 Create `scripts/check-animation.sh` (content in `specs/002-reanimated-migration/quickstart.md` §Automated gates) and register it as the `check:animation` script in `package.json`. Verify it **fails** against the current tree (expected: 61 matching lines across 17 files for the legacy-API grep, 0 for `InteractionManager`), then `chmod +x` it. This is the durable deliverable for the "avoid InteractionManager" half of the request — see `research.md` R3, which confirms zero current usages
- [X] T006 [P] Change the Reanimated Babel plugin in `babel.config.js` from `react-native-reanimated/plugin` to `react-native-worklets/plugin`, keeping it last in the `plugins` array. Non-breaking hygiene only — the old path is a two-line re-export of the new one (`research.md` R2). Clear the Metro cache (`npx expo start -c`) and confirm the app still boots
- [X] T007 Create `src/hooks/useShakeAnimation.js` exporting `useShakeAnimation() -> { shakeStyle, shake }` per `contracts/animation-api.md` §C2. Implementation: `useSharedValue(0)`; `shake()` calls `Vibration.vibrate()`, sets the value to `0`, then assigns `withRepeat(withTiming(2, { duration: 120, easing: Easing.linear }), 2, false)`; `shakeStyle` is a `useAnimatedStyle` returning `{ transform: [{ translateX: interpolate(v.value, [0, 0.5, 1, 1.5, 2], [0, -10, 0, 10, 0]) }] }`. All five consumer screens are verified byte-identical, so the hook takes **no options**
- [X] T008 [P] Delete the dead import `import { sub } from "react-native-reanimated"` at `src/screens/login/otpVerification.js:7`. `sub` is a Reanimated v1 API removed in v2+ and resolves to `undefined`; the other `sub*` identifiers in the file are `subInterval` and unrelated
- [X] T009 [P] Delete `src/features/locations/components/headerImage.component.js`. The entire component body is `return <Animated.Image></Animated.Image>` and a repo-wide grep for `headerImage` returns **zero importers**

**Checkpoint**: Gate installed and failing as expected; shared hook ready; dead code gone

---

## Phase 3: US1 — Validation shake (Priority: P1) 🎯 MVP

**Goal**: Remove five byte-identical copies of the shake block in favour of the shared hook. Largest single reduction in duplicated animation code and the lowest risk in the migration.

**Independent test**: Submit each of the five forms with an invalid field. Each shakes left-right with identical amplitude (±10px) and duration (240ms, four half-shakes) versus the baseline recording, and still vibrates.

- [X] T010 [P] [US1] Convert `src/screens/corporate/registration.screen.js` (locators 112–132, 134) to `useShakeAnimation`: delete `animatedShake`/`shakeInterpolate`/`shake`/`shakeAnimatedStyle`, remove `Animated` and `Easing` from the multi-line `react-native` import, and switch the shaken container to `Animated.View` from `react-native-reanimated`
- [X] T011 [P] [US1] Convert `src/screens/corporate/registrationDetails.screen.js` (locators 126–146, 148) — same steps as T010
- [X] T012 [P] [US1] Convert `src/screens/reset-password/changePassword.js` (locators 29–49, 51) — same steps as T010
- [X] T013 [P] [US1] Convert `src/screens/reset-password/forgotPassword.js` (locators 36–56, 58) — same steps as T010
- [X] T014 [P] [US1] Convert `src/screens/login/updateMember.screen.js` (locators 51–71, 73) — same steps as T010
- [ ] T015 [US1] Run sweep scenario B1 from `specs/002-reanimated-migration/quickstart.md` on both platforms; confirm all five shakes match baseline, then commit

**Checkpoint**: Five screens migrated, ~110 lines of duplication removed

---

## Phase 4: US2 — Looping shimmer (Priority: P1)

**Goal**: Convert the two infinite-loop shimmers. Highest performance payoff of the mechanical conversions — both render inside lists, so a leaked loop is a measurable cost.

**Independent test**: Sweep scenarios B3 and B4. Shimmer is continuous with no seam at the loop boundary; scrolling a long image list for 2 minutes shows no JS FPS decay in the perf monitor.

- [X] T016 [P] [US2] Convert `src/components/skeleton.js` (locators 2, 14, 17–31). Target: `withRepeat(withSequence(withDelay(200, withTiming(opacityMax, { duration: 300, easing: Easing.linear })), withTiming(opacityMin, { duration: 700, easing: Easing.linear })), -1, false)`. `reverse` **must be false** — the sequence already returns to its start value
- [X] T017 [US2] Add `cancelAnimation(animatedValue)` to the `useEffect` cleanup in `src/components/skeleton.js`. `withRepeat` returns no stoppable handle, unlike the `Animated.loop` handle it replaces. **Check first whether the current code cleans up at all** — if it does not, this fixes a pre-existing leak; note that in the commit message
- [X] T018 [P] [US2] Convert the `SkeletonLoader` shimmer in `src/components/cacheImage.js` (locators 9, 34, 38–46). Target: reset `shimmer` to `0`, then `withRepeat(withTiming(1, { duration: 1200 }), -1, false)`. Replace the existing `return () => loop.stop()` cleanup with `cancelAnimation(shimmer)`. Preserve the `useMemo` that rebuilds the `translateX` interpolation on measured-width change — move it inside `useAnimatedStyle` reading `containerWidth`
- [ ] T019 [US2] Run sweep scenarios B3 and B4 from `specs/002-reanimated-migration/quickstart.md` on both platforms, including the 2-minute FPS check, then commit

**Checkpoint**: No infinite animation can outlive its component

---

## Phase 5: US3 — Entrance and fade-in sequences (Priority: P2)

**Goal**: Convert the staggered mount animations on the success and summary screens.

**Independent test**: Sweep scenarios B2 and B5. Stagger timing matches baseline; navigating away and back re-runs the animation with no flash of the final state.

- [X] T020 [P] [US3] Convert `src/screens/corporate/registrationSuccess.screen.js` (locators 3, 12–14, 27–48). `withSpring`/`withTiming` have **no `delay` option** — wrap each in `withDelay`: `bounceValue = withDelay(1000, withSpring(1, { mass: 1 }))`, `fadeInValue = withDelay(1000, withTiming(1, { duration: 800 }))`, `fadeInButton = withDelay(1500, withTiming(1, { duration: 700 }))`. Keep the `[0,1] → [-100,0]` translateY and `[0,1] → [0.9,1]` button-scale interpolations. Drop the `Easing` import from `react-native` after confirming it is unused
- [X] T021 [P] [US3] Convert `src/screens/corporate/registrationSuccessByServices.screen.js` (locators 3, 14–16, 31–52) — same approach as T020. **Do not merge this file with T020's**; the two are near-identical but deduplicating them is a separate decision, out of scope here. Leave the duplication and flag it in the commit message
- [X] T022 [P] [US3] Convert `src/screens/offer/transactionSummary.screen.js` (locators 5, 13–15, 35–50): three staggered opacities, initial values `0`, `0`, `0.6` — preserve the `0.6` initial exactly
- [X] T023 [P] [US3] Convert `src/components/postCardUpload.js` (locators 3, 12, 17–27). The existing effect stops the animation and calls `animatedValue.setValue(0)` on unmount — replace with `cancelAnimation(animatedValue)` plus an explicit reset to `0`
- [ ] T024 [US3] Run sweep scenarios B2 and B5 from `specs/002-reanimated-migration/quickstart.md` on both platforms, then commit

---

## Phase 6: US4 — Press scale (Priority: P2)

**Goal**: Convert `AnimatedButton` and fix its per-render value bug.

**Independent test**: Sweep scenario B6. Press-in scales to 0.9 and dims; press-out springs back; feel matches baseline. Rapid repeated presses no longer reset mid-animation.

- [X] T025 [US4] Convert `src/components/animatedButton.js` (locators 4, 22, 26–42, 44, 52) to `useSharedValue` + `useAnimatedStyle`. This inherently fixes **defect D1**: line 22 is `const buttonScale = new Animated.Value(1)` with no `useRef`/`useMemo`, so every re-render discards the in-flight animation. Call the fix out in the commit message so it is not read as refactor noise
- [X] T026 [US4] Map the `speed` prop (default `200`) onto `withSpring({ damping, stiffness })` inside `src/components/animatedButton.js`. Per `research.md` R5 there is no algebraic conversion from the legacy `speed`/`bounciness` model — start at `{ damping: 15, stiffness: 150 }` and tune on device. **The `speed` prop name and default must not change** (`contracts/animation-api.md` §C1); higher must still mean faster
- [ ] T027 [US4] Smoke-test the single consumer at `src/screens/login/requestapproval.screen.js:604` and run sweep scenario B6 on both platforms, then commit

---

## Phase 7: US5 — Scroll-driven header (Priority: P2)

**Goal**: Convert the location-detail sticky header to `useAnimatedScrollHandler`. Should be visibly smoother than baseline.

**Independent test**: Sweep scenarios C1–C3. Header slides in between scroll offsets 100 and 270, clamps at both ends, stays above the list, `RefreshControl` still fires, and tracks a hard fling with no lag.

- [X] T028 [US5] Convert the scroll wiring in `src/screens/location/location-view.screen.js` (locators 304, 306–310, 388–391): replace `Animated.event` with `useAnimatedScrollHandler(({ contentOffset }) => { scrollY.value = contentOffset.y })`, import `Animated.FlatList` from `react-native-reanimated`, and move the header style into `useAnimatedStyle` using `interpolate(scrollY.value, [100, 270], [-200, 0], Extrapolation.CLAMP)`. Keep `scrollEventThrottle={16}`
- [X] T029 [US5] Delete the dead effect at `src/screens/location/location-view.screen.js:320-324` (**defect D2**): it tests `if (animatedValue > 2)` where `animatedValue` is an `Animated.Value` instance that is never `> 2`, its body is entirely commented out, and its dependency is a stable ref so it never re-runs
- [ ] T030 [US5] Verify the header still renders above the list (`position: absolute`, `zIndex: 999`) and that pull-to-refresh still works through the Reanimated `Animated.FlatList` — run sweep scenarios C1–C3 from `specs/002-reanimated-migration/quickstart.md` on both platforms, then commit

---

## Phase 8: US6 — JS-driven layout and colour (Priority: P3) ⚠️ HIGHEST RISK

**Goal**: Move the four `useNativeDriver: false` animations onto the UI thread. This is the substantive win of the migration and where regressions will appear.

**⚠️ Every task in this phase has a completion callback that touches React state.** Per
`contracts/animation-api.md` §C3, each MUST be wrapped in `runOnJS(...)` and guarded on the
callback's `finished` flag. Omitting `runOnJS` fails **silently in release builds**.

**Independent test**: Sweep scenarios D1–D6, run against a **release** build, not just dev.

- [ ] T031 [US6] Convert `src/components/customTextInput.js` (locators 9, 92–105, 112–128) to a shared value + `useAnimatedStyle` with three interpolations: `scale [0,100] → [1,0.8]`, `translateX [0,100] → [0, label.length * -1]`, `translateY [0,100] → [0,-22]`, 200ms. The `useImperativeHandle` contract (`focus`, `clear`, `getNativeInput`) must not change — `contracts/animation-api.md` §C1. Confirm the style re-derives when the `label` prop changes, since `translateX` depends on `label.length`. This component renders on **every form in the app**
- [ ] T032 [US6] Handle the `setFocused` calls in `src/components/customTextInput.js` (**defect D3**): `.start(setFocused(true))` invokes the setter immediately and passes `undefined` as the callback, so the state change currently happens at animation **start**, not end. **Preserve today's behaviour** — call `setFocused` before starting the animation — and log a follow-up issue for whether the intended behaviour differs. Do not silently change UX inside a refactor
- [ ] T033 [US6] Convert `src/components/offerList.js` (locators 40, 42–58) to `useSharedValue(initialHeight)` + `useAnimatedStyle(() => ({ height: h.value }))`, 300ms both directions. `collapse()` must call `withTiming(..., (finished) => { if (finished) runOnJS(setShowAll)(!showAll) })` so `showAll` still flips **after** the collapse completes. Also add an effect resyncing the shared value when `offers.length` changes — `useSharedValue` only reads its argument once, but `initialHeight` is recomputed every render
- [ ] T034 [US6] Convert `src/screens/login/requestapproval.screen.js` (locators 55, 143–159, 233) to a shared value + `useAnimatedStyle` on height. Both springs become `withSpring`; `closeCamera`'s `delay: 200` has no `withSpring` equivalent, so wrap it as `withDelay(200, withSpring(...))`. `setIsCameraOpen(false)` must be `runOnJS`-wrapped in the completion callback so the camera does not unmount mid-animation
- [ ] T035 [US6] Convert `src/features/profile/profRedeemHistory.js` (locators 141, 147–161) to a shared value + `useAnimatedStyle` on height. Seed from `0` and push `viewHeight` into the shared value in an effect once `onLayout` fires — `useSharedValue(viewHeight)` would capture the initial `0`. `setDisplayBreakdown` calls are the same **defect D3** pattern as T032; preserve current behaviour and log the follow-up
- [ ] T036 [US6] **Product decision required before signing off T035** (**defect D4**, recorded in `specs/002-reanimated-migration/data-model.md`): `src/features/profile/profRedeemHistory.js` currently declares `useNativeDriver: true` while animating `height`, which the native driver does not support — so the panel most likely does not animate today. After conversion it will. Confirm with the product owner whether an animating breakdown panel is intended; if not, the correct fix is to remove the animation, not to reproduce the broken version. Do not close this phase on a visual diff alone
- [ ] T037 [US6] Run sweep scenarios D1–D6 from `specs/002-reanimated-migration/quickstart.md` on both platforms **against a release build**, watching specifically for missing `runOnJS` symptoms (state changes that never commit), then commit

**Checkpoint**: All four JS-thread animations now run on the UI thread

---

## Phase 9: US7 — Deprecated API cleanup (Priority: P3)

**Goal**: Bring the three files already using Reanimated onto the Reanimated 4 spelling.

**Independent test**: `git grep -n Extrapolate` returns nothing; carousels and slideshows still animate correctly.

- [X] T038 [P] [US7] Rename `Extrapolate` → `Extrapolation` in `src/components/slideshowV2.component.js` (locators 14–19). `Extrapolate` is the Reanimated 3 spelling — `contracts/animation-api.md` §C5
- [X] T039 [P] [US7] Rename `Extrapolate` → `Extrapolation` in `src/components/hotpick/hotpicks.component.js` (locators 19–24), and remove the redundant bare `import "react-native-reanimated"` at line 17 — the named import two lines below already loads the module
- [ ] T040 [US7] Smoke-test the hotpicks carousel, the V2 slideshow, and `src/screens/posts/postDetailMarketplace.screen.js` (a `react-native-reanimated-carousel` consumer, otherwise untouched), then commit

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T041 Run `npm run check:animation` — must now exit `0` with zero matches for both the legacy-API grep and `InteractionManager`
- [ ] T042 Run `npm test` and confirm the result is no worse than the T003 baseline (regression check that the refactor broke no module graph)
- [ ] T043 Run `git grep -n Extrapolate` and confirm zero results
- [ ] T044 Complete the full regression checklist in `specs/002-reanimated-migration/quickstart.md`, including the release-build pass and the 2-minute FPS check for loop leaks
- [ ] T045 [P] File the follow-up issues logged during T032 and T035 for the **defect D3** sites in `src/components/customTextInput.js` and `src/features/profile/profRedeemHistory.js`, recording current-vs-intended behaviour for each so the decision is not lost
- [ ] T046 [P] **Non-blocking follow-up (T-05b)**: repair the ESLint setup so the guardrail gets editor-level feedback. Currently `npx eslint src` fails outright — install `eslint-config-prettier`, switch `"parser": "babel-eslint"` to `"@babel/eslint-parser"`, drop the removed `prettier/react` config, and point the `lint` script at `src/` instead of the non-existent `app/`. Then add `no-restricted-imports`/`no-restricted-syntax` rules mirroring `scripts/check-animation.sh`. See `research.md` R6 — this is a larger job than the migration guardrail and must not block it

---

## Dependencies

```
Phase 1 (T001-T004)  ──> Phase 2 (T005-T009)
                             │
                             ├─ T007 ──> US1 (T010-T015)
                             ├─────────> US2 (T016-T019)
                             ├─────────> US3 (T020-T024)
                             ├─────────> US4 (T025-T027)
                             ├─────────> US5 (T028-T030)
                             ├─────────> US6 (T031-T037)   ⚠️ do last
                             └─────────> US7 (T038-T040)
                                             │
                                             v
                                    Phase 10 (T041-T046)
```

**Hard dependencies**:
- T007 (shared hook) blocks T010–T014
- T005 (gate) should land before any conversion so it fails-then-passes meaningfully
- T004 (baseline recordings) blocks every verification task — capture before converting
- T016 blocks T017 (same file); T031 blocks T032 (same file); T035 blocks T036
- Phase 10 requires all conversion phases complete

**Soft ordering**: US1–US5 and US7 are mutually independent and may proceed in any order or
concurrently. US6 is sequenced **last** by design (`research.md` R7) — the native-driver
conversions are behaviour-preserving and build familiarity with the idiom, so an interruption
before US6 still leaves the codebase coherent.

## Parallel execution examples

**Within US1** — five independent files, one hook:
```
T010, T011, T012, T013, T014   # all [P], different files
```

**Within US3** — four independent files:
```
T020, T021, T022, T023         # all [P]
```

**Across stories** — after Phase 2, a team of three could take:
```
Dev A: US1 (T010-T015)  →  US4 (T025-T027)
Dev B: US2 (T016-T019)  →  US7 (T038-T040)
Dev C: US3 (T020-T024)  →  US5 (T028-T030)
All:   regroup for US6 (T031-T037) — highest risk, worth reviewing together
```

**Never parallel**: T016/T017 (same file), T031/T032 (same file), T035/T036 (decision gate).

## Implementation strategy

**MVP scope**: Phase 1 + Phase 2 + US1 (T001–T015). This delivers the guardrail that satisfies the
InteractionManager requirement permanently, removes ~110 lines of duplicated animation code, and
proves the conversion idiom on the lowest-risk pattern in the codebase.

**Incremental delivery**: Each task is one file and one commit, so any single conversion reverts
with `git revert <sha>` without disturbing the rest. No phase depends on a later phase, so the
migration can be paused after any checkpoint and shipped as-is.

**Risk concentration**: 7 of the 46 tasks (T031–T037) carry most of the regression risk. Budget
review time accordingly, and do not let schedule pressure push US6 out mid-phase — finish it or
defer it whole.
