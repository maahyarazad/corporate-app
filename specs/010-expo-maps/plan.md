# Implementation Plan: expo-maps Migration & Map Optimisation

**Branch**: `010-expo-maps` (not yet created — branch from `009-safe-area-context`)
**Date**: 2026-09-08
**Input**: "010 use expo-maps in the map.screen.js and optimiza the map in both IOS and ANdroid"
**Spec**: `specs/010-expo-maps/spec.md`

## Provenance

This plan was written *before* `spec.md`, from the one-line description above
plus direct source investigation. The spec was then backfilled from this plan to
formalise the user stories `/speckit-tasks` requires — the same order `005` and
`009` used. It introduces no scope beyond what is planned here.

## Baseline correction

The working tree is clean at `596e2ae`. An earlier `@rnmapbox/maps` migration
and the `mapPadding` fix in this session **were reverted** and are not in the
tree. This plan is written against the real current state:
`react-native-maps@1.20.1`, `provider="google"` on both platforms, and all four
defects in R8 live.

One piece of debris survived the revert: an empty `src/services/mapbox/`
directory. It should be removed.

## Summary

Replace `react-native-maps` with Expo's first-party `expo-maps` across both map
surfaces, and fix the four defects currently degrading the screen.

The performance argument is concrete and is the reason to do this at all.
`react-native-maps` renders each of the 100 partner pins
(`src/screens/map.screen.js:125`) as a React child backed by a native view.
expo-maps takes markers as a **declarative array prop**, serialised once per
change — no per-marker element, no per-marker view lifecycle, no
`tracksViewChanges` mitigation needed. On iOS it also moves the app from
Google's iOS SDK to native Apple Maps (SwiftUI MapKit), which is materially
smoother and needs no API key.

**The cost is a hard iOS 17 floor.** Below iOS 17 `AppleMaps.View` renders
`EmptyView()` — a silently blank map (`research.md` R2). This project currently
targets iOS 15.1. That gate must be decided before any code is written.

## Technical Context

**Platform**: React Native 0.81.5, Expo SDK 54, Hermes, New Architecture
**Current map library**: `react-native-maps@1.20.1`, `provider="google"` both platforms
**Target map library**: `expo-maps@~0.12.10` (the SDK-54 line — see `research.md` R1)
**iOS deployment target**: currently `15.1` (`ios/Podfile:19`) → must become `17.0`
**Native workflow**: prebuild/CNG — `ios/` and `android/` are gitignored (`.gitignore:47-48`); `app.json` is the source of truth
**Marker volume**: 100 (`map.screen.js:125`)
**Testing**: Jest, pure logic only. No component or visual-regression harness. **All acceptance verification for this feature is manual, on device, both platforms.**
**Repo gates**: `npm test`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`

**RESOLVED 2026-09-08 — minimum supported iOS version**: raise to **17.0**.
Confirmed by the project owner. This drops iOS 15 and 16 devices; the App Store
refuses installation rather than presenting a blank map. Phases B and C are
unblocked.

**NEEDS CLARIFICATION — non-blocking**: whether losing the branded pin image on
iOS is acceptable (expo-maps allows only SF Symbols on the Apple side —
`research.md` R5). Does not block implementation; affects marker appearance
only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

**Status: cannot be evaluated.** `.specify/memory/constitution.md` is the
unmodified template — every principle is still a `[PRINCIPLE_N_NAME]`
placeholder. There are no ratified gates to check against.

This is not a pass and should not be recorded as one. If the project wants real
gates, `/speckit-constitution` fills them in. In their absence the plan is held
to the repo's mechanical gates (listed above) and to the house conventions
visible in the codebase:

| Convention | Source | Applied here |
|---|---|---|
| No inline style literals | `check:styles`, commit `2ce9948` | All map styles via `StyleSheet.create` |
| Module-scope `StyleSheet` only | `check:styles` | Layer/marker style constants at module scope |
| Screens take no `navigation` prop | `check:screen-props` | `useNavigation()`, unchanged |
| Stable prop identity into native views | `31f4bff` commit rationale | Marker array and camera config memoised |

**Post-Phase-1 re-check**: unchanged — still unevaluable, same mechanical gates
apply. No new violations introduced by the Phase 1 design.

## Project Structure

### Documentation (this feature)

```text
specs/010-expo-maps/
├── plan.md              # This file
├── research.md          # Phase 0 — verified findings, decisions, defect list
├── data-model.md        # Phase 1 — marker/camera shapes and mappings
├── quickstart.md        # Phase 1 — manual verification runbook
├── contracts/
│   └── platform-map.md  # Phase 1 — the wrapper component's prop contract
├── spec.md              # MISSING — see "Process gap"
└── tasks.md             # Phase 2 — /speckit-tasks, not created here
```

### Source Code (repository root)

```text
src/
├── components/
│   └── map/
│       ├── platformMap.component.js   # NEW — owns the Platform.OS branch
│       └── map.component.js           # REWRITE — static preview
└── screens/
    └── map.screen.js                  # REWRITE — interactive screen

app.json                               # expo-maps plugin; drop ios googleMapsApiKey,
                                       # KEEP android googleMaps.apiKey (research.md R7)
ios/Podfile.properties.json            # ios.deploymentTarget → "17.0"
                                       # (written by expo-build-properties, already a plugin)
```

**Structure Decision**: one new wrapper component absorbs the platform split so
neither consumer forks. `expo-maps` exposes two components with non-identical
prop types (`research.md` R3); letting that leak into two call sites would
duplicate the divergence twice over.

Consumers of `map.component.js` — `src/screens/events/eventDetail.screen.js:19`
and `src/screens/location/location-view.screen.js:25` — keep their current
`{ lat, lng, zoom }` prop shape. This migration is invisible to them.

## Phased approach

The iOS-17 gate blocks the migration but not the defect fixes. Phase A is
independently shippable and lands the user-visible win immediately.

| Phase | Content | Blocked by iOS 17 decision? |
|---|---|---|
| **A** | Fix R8.1–R8.4 in place on `react-native-maps` | **No** — ship now |
| **B** | Add `expo-maps`, build `platformMap.component.js`, raise iOS target | Unblocked — iOS 17 confirmed |
| **C** | Migrate both surfaces, remove `react-native-maps` | Unblocked — iOS 17 confirmed |

Phase A alone fixes the untappable my-location button and removes the bogus
viewport projection, so it ships first regardless of how B and C progress.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| iOS <17 users get a blank map | **Critical** | Deployment target raised to 17.0 (decided 2026-09-08). Verify `MinimumOSVersion` in the built app — `quickstart.md` Gate 5 |
| expo-maps is pre-1.0, API may break | High | Wrapper component confines the blast radius to one file |
| No clustering at any zoom (`research.md` R5) | Medium | Acceptable at 100 pins; revisit if partner count grows |
| iOS loses the branded pin | Medium | Open question above; SF Symbol + tint on iOS |
| Apple Maps cartography differs from Google | Medium | Product review before ship |
| No automated test can catch a map regression | Medium | `quickstart.md` is the manual gate; run it on both platforms |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New `platformMap.component.js` wrapper | expo-maps has two components with divergent props (`research.md` R3) | Branching inline in both consumers duplicates the divergence at two call sites and leaves no single place to absorb pre-1.0 API churn |
| Raising the iOS deployment target | `AppleMaps.View` is `EmptyView()` below iOS 17 | A `Platform.Version` fallback to react-native-maps means shipping and maintaining both map stacks forever |
