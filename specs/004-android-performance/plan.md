# Implementation Plan: Android Performance Regression

**Branch**: `004-android-performance` (not yet created — branch from `003-flatlist-optimization`)
**Date**: 2026-08-27
**Input**: "as the flatlist optimization completed the android version is super laggy now and it seems like there are memory leaks — check all the available optimization for android devices"

## Summary

This is a **regression report against `002` and `003`**, and the investigation should be treated
that way rather than as a general Android tuning exercise. Before writing this plan I looked for a
mechanism that would explain "suddenly laggy on Android" in the code those branches touched, and
found one.

**Prime suspect — `Skeleton` loops now run forever on the UI thread.**

`002` converted `skeleton.js` from `Animated.loop(...)` with `useNativeDriver: true` to
Reanimated's `withRepeat(..., -1)` + `useAnimatedStyle`. Those are not equivalent in cost:

| | Before (`002`) | After (`002`) |
|---|---|---|
| Mechanism | RN native driver — animation graph serialised to native **once**, zero per-frame JS | Reanimated **mapper** on the UI runtime, worklet re-evaluated **every frame** |
| Cost per instance | Near-free after setup | A per-frame worklet evaluation |

On its own that is a modest trade. The problem is what it combines with:

**`SkeletonLocation` never unmounts.** It hides itself with `display: display ? "flex" : "none"`
(`src/components/skeletonLocation.js:11`), so its **9 `<Skeleton>` children stay mounted after
loading finishes** — and each one keeps its infinite `withRepeat(-1)` running. `skeleton.js` starts
the loop in a mount effect with no visibility check, so a fully-loaded, visually-static location
screen is still evaluating **9 worklets per frame, forever**.

Under the old native driver this was cheap enough to go unnoticed. Under Reanimated it is not, and
it compounds: every location screen left mounted in the navigator stack adds nine more.

That is a concrete, mechanically-explained regression introduced by my own change. **It should be
tested and fixed before any general Android tuning happens** — see `research.md` R1.

### A hypothesis I checked and discarded

I initially suspected the `FlatList` → `ScrollView` conversions in `003` had dropped
`removeClippedSubviews`, which older React Native defaulted to `true` for `VirtualizedList` on
Android. **That default no longer exists in RN 0.81** — verified in
`node_modules/react-native/node_modules/@react-native/virtualized-lists/`. The conversion lost
nothing there. Recorded so nobody re-derives it (`research.md` R3).

## Technical Context

**Platform**: React Native 0.81.5, Expo SDK 54, Hermes, **New Architecture / Fabric enabled**
(`android/gradle.properties:38`, `:42`)

**Animation**: `react-native-reanimated@4.1.7` + `react-native-worklets@0.5.1`

**Android build**: `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`;
`org.gradle.jvmargs=-Xmx2048m`. **`enableProguardInReleaseBuilds` is not set** — see R6.

**Testing**: Jest (27 tests, pure logic). No performance harness. All measurement is manual on
device — see `quickstart.md`.

**NEEDS CLARIFICATION → resolved as the first task, not assumed**: whether the laggy build is a
**debug** build. A debug Android build with Fabric + Reanimated is dramatically slower than release,
and this is the single most common explanation for "suddenly laggy on Android". T-01 rules it out
before anything else is touched (`research.md` R2).

**Constraints**:
- Reverting `002`/`003` commits is a **first-class outcome**, not a failure. Each was committed
  individually for exactly this reason.
- No fix ships without a before/after measurement. This plan exists because unmeasured optimization
  caused the problem.

## Constitution Check

`.specify/memory/constitution.md` remains an unpopulated template — no ratified gates, so this
passes vacuously. Self-imposed gates:

| Gate | Status |
|---|---|
| Diagnose before optimising | PASS — Phases A–B are measurement only; no fix lands before B |
| Every fix has a before/after number | PASS — enforced by `contracts/performance-budget.md` |
| Revert is an acceptable outcome | PASS — Phase C offers it explicitly per suspect |
| No speculative "Android best practice" changes | **CONDITIONAL** — Phase E is gated on Phase B evidence and must not run if the cause is already fixed |

The last gate matters most. The user asked to "check all the available optimization for android
devices", and the temptation is to apply a long checklist. That is what produced this regression.
Phase E is explicitly **contingent**: if Phase C resolves the lag, the remaining items stay as
recorded findings, not changes.

## Suspect Inventory

Ranked by strength of mechanism, full detail in **[data-model.md](./data-model.md)**:

| # | Suspect | Origin | Confidence |
|---|---|---|---|
| S1 | `Skeleton` infinite worklets that never stop (9 per location screen) | `002` | **High — mechanism confirmed in code** |
| S2 | Debug build being measured | environment | **High prior, untested** |
| S3 | `CacheImage` shimmer — same conversion, one per list row | `002` | Medium |
| S4 | `handledNotificationIds` Set grows unbounded | pre-existing | Low (real leak, small) |
| S5 | `Map`/`Slideshow` mounted eagerly in the converted ScrollView | `003` | Low-Medium |
| S6 | `toppartners` memo churn on context identity | `003` | Low |
| S7 | Missing Proguard/R8 in release builds | pre-existing | Low (size, not frame rate) |

## Phased Approach

**Phase A — Establish the measurement** (T-01…T-04): confirm debug vs release, capture FPS and
memory traces on a real Android device for the three worst screens, record a baseline on `master`
for comparison.

**Phase B — Bisect** (T-10…T-13): `git bisect` across the `002`/`003` commits with a fixed manual
scenario. This is the decisive phase — it converts suspicion into a named commit. Do not skip it in
favour of fixing S1 on the strength of the mechanism alone.

**Phase C — Fix the confirmed cause** (T-20…T-26): for S1 the fix is to stop animating what is not
visible — either unmount the skeleton or gate the loop on a `display` prop. Includes the revert
option per suspect.

**Phase D — Verify** (T-30…T-33): re-measure against the Phase A baseline and the budgets in
`contracts/performance-budget.md`. A fix that does not move the number is reverted, not kept.

**Phase E — Broader Android hygiene** (T-40…T-46) — **contingent**. Only runs if Phase D shows the
app still misses budget. Items are individually justified in `research.md` R6.

Task breakdown belongs in `tasks.md` — run `/speckit-tasks` next.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| A full bisect phase before any fix | The `002`/`003` branches changed 62 files; the mechanism for S1 is strong but "strong mechanism" is exactly what justified the change that broke it | Fixing S1 directly risks treating a symptom while the real cause stays in |
| Skeleton visibility gating rather than reverting `002` | Reanimated conversion is otherwise sound and `002` fixed real bugs | A blanket revert loses the `AnimatedButton` and dead-code fixes too |

## Progress

- [x] Phase 0: Research → `research.md`
- [x] Phase 1: Design → `data-model.md`, `contracts/`, `quickstart.md`
- [x] Constitution check (vacuous; self-imposed gates recorded)
- [ ] Phase 2: Tasks (`/speckit-tasks`)
- [ ] Phase 3: Implementation (`/speckit-implement`)
