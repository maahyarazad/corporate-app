---
description: "Task list for expo-maps migration & map optimisation"
---

# Tasks: expo-maps Migration & Map Optimisation

**Input**: Design documents from `/specs/010-expo-maps/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/platform-map.md`, `quickstart.md`

**Tests**: No test tasks are generated. This repo's Jest suite covers pure logic only — there is no
component harness, no visual-regression tooling, and nothing that can render a map (`research.md`
R9). Verification is manual, via `quickstart.md`. Inventing test tasks that cannot be written would
be dishonest about the safety net this feature has.

**Organization**: Tasks are grouped by user story. US1 ships independently of everything else.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Mobile app, prebuild/CNG workflow. `ios/` and `android/` are gitignored (`.gitignore:47-48`), so
native config is edited in `app.json` / `ios/Podfile.properties.json` and regenerated. Source lives
under `src/`.

---

## Phase 1: Setup

**Purpose**: Clear debris and establish the measurement baseline before anything changes.

- [X] T001 Remove the empty leftover directory `src/services/mapbox/` (debris from a reverted migration, `plan.md` "Baseline correction")
- [ ] T002 Record a pre-change performance baseline for `src/screens/map.screen.js`: JS and UI frame rates while panning and pinch-zooming with all 100 pins loaded, on both platforms. Save the numbers into `specs/010-expo-maps/quickstart.md` under Gate 3 — NFR-001 requires a before/after comparison and the "before" is unrecoverable once T010 lands
  - ⚠️ **BLOCKED — requires physical devices.** Not captured. The pre-change baseline is now unrecoverable on this branch; re-measure against `master` if the before/after number is still wanted.
- [X] T003 [P] Confirm all repo gates are green before starting: `npm test`, `npm run lint`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nothing here. US1 is a defect fix on the existing library and needs no new
infrastructure; the `expo-maps` groundwork is scoped to US2 because US1 must be able to ship without
it.

**⚠️ Deliberately empty.** Placing the `expo-maps` install here would couple the P1 bug fix to the
iOS 17 floor and destroy US1's independence, which is the main reason the phasing exists
(`plan.md`, "Phased approach").

---

## Phase 3: User Story 1 — The my-location button works on iOS (Priority: P1) 🎯 MVP

**Goal**: Close the originally reported defect. The my-location button recentres the camera when
tapped, on both platforms.

**Independent Test**: On iOS, pan away from your position and tap the my-location button — the
camera recentres. Repeat on Android. No migration and no iOS 17 floor required.

### Implementation for User Story 1

- [X] T004 [US1] Delete the `mapPadding` prop from the `<MapView>` in `src/screens/map.screen.js:327`. This is the defect cause: it is assigned to `GMSMapView.padding`, which is the region the Google Maps iOS SDK lays its controls out in (`research.md` R8.1). Satisfies FR-002
- [X] T005 [US1] Delete the now-unused `mapPadding` `useMemo` at `src/screens/map.screen.js:70`, the `screenHeight` binding at `:63`, and the `useWindowDimensions` import at `:17` — `mapPadding` was their only consumer
- [X] T006 [US1] Delete the `followsUserLocation` prop at `src/screens/map.screen.js:325`. It is implemented only in `AirMaps` (Apple Maps) and is a no-op under `provider="google"` on both platforms (`research.md` R8.2)
- [X] T007 [US1] Fix `styles.map` in `src/screens/map.screen.js`: remove `height: '90%'`, which contradicts `flex: 1` (`research.md` R8.4)
- [X] T008 [US1] Tidy the malformed indentation on the `showsUserLocation` / `showsMyLocationButton` props in `src/screens/map.screen.js:324-326`
- [ ] T009 [US1] Verify against `quickstart.md` Gate 1 on a physical iOS device — the button must actually respond to taps, which is the whole story. Then Gate 2 on both platforms to confirm marker selection still resolves to the correct partner (FR-004)
  - ⚠️ **BLOCKED — requires a physical iOS device.** Code complete and verified statically; the tap itself is unverified.

**Checkpoint**: The reported bug is fixed and shippable. US1 can be released here, on
`react-native-maps`, with no iOS version change. Everything below is the migration.

---

## Phase 4: User Story 2 — The map stays smooth with all partner pins loaded (Priority: P2)

**Goal**: Replace 100 native marker views with one serialised marker array, and move iOS onto native
Apple Maps.

**Independent Test**: With all pins loaded, fling and pinch-zoom repeatedly and run ten
select/dismiss cycles — no visible stutter, no progressive slowdown. Frame rates improve against the
T002 baseline.

### Platform groundwork

- [X] T010 [US2] Install the SDK-54-compatible release: `npx expo install expo-maps` — must resolve to the `0.12.x` line, since `55.x` is SDK 55 (`research.md` R1). Verify the resolved version in `package.json` before continuing
- [X] T011 [US2] Set `"ios.deploymentTarget": "17.0"` in `ios/Podfile.properties.json` via the existing `expo-build-properties` plugin entry in `app.json`. **Non-negotiable** — below iOS 17 `AppleMaps.View` renders `EmptyView()`, a silently blank map (`research.md` R2). Satisfies PR-001
- [X] T012 [P] [US2] Remove `expo.ios.config.googleMapsApiKey` from `app.json` — iOS runs on Apple Maps now (PR-003). **Do not touch `expo.android.config.googleMaps.apiKey` at `app.json:124`**; Android still requires it and the expo-maps plugin does not supply it (`research.md` R7, PR-002)
- [X] T013 [US2] Run `npx expo prebuild --clean` and confirm the generated iOS project carries `MinimumOSVersion` 17.0

### The wrapper component

- [X] T014 [US2] Create `src/components/map/platformMap.component.js` implementing the full contract in `contracts/platform-map.md`: the `Platform.OS` branch between `AppleMaps.View` and `GoogleMaps.View`, the props table (`markers`, `initialCamera`, `onMarkerPress`, `showsUserLocation`, `showsMyLocationButton`, `interactive`, `style`), and the `setCamera(position, durationMs?)` imperative handle via `useImperativeHandle`. This is the only file in `src/` permitted to import `expo-maps` (FR-009)
- [X] T015 [US2] In `platformMap.component.js`, implement the `MapMarker` → platform-record projection from `data-model.md` E2, including the iOS/Android icon divergence (`systemImage` + `tintColor` vs `icon`)
- [X] T016 [US2] In `platformMap.component.js`, filter markers with non-finite `latitude`/`longitude` before they reach native (FR-005, `data-model.md` E1). `react-native-maps` silently dropped bad coordinates; `expo-maps` serialises the array in one pass, so one malformed record risks the batch
- [X] T017 [US2] In `platformMap.component.js`, map `showsUserLocation` → `properties.isMyLocationEnabled` and `showsMyLocationButton` → `uiSettings.myLocationButtonEnabled` on both platforms, and `interactive={false}` → disabled scroll/zoom/rotate/tilt in `uiSettings`
- [X] T018 [US2] Confirm `platformMap.component.js` exposes no `mapPadding` and no controlled-camera prop — both are contract-level prohibitions, not omissions (FR-002, FR-006, `contracts/platform-map.md` "Deliberately absent")

### Migrating the main screen

- [X] T019 [US2] Rewrite the map JSX in `src/screens/map.screen.js` to render `<PlatformMap>` instead of `<MapView>`, keeping the `partnerLocations && myLocation` render gate (`data-model.md` E5)
- [X] T020 [US2] Replace the `PartnerMarker` component and the `partnerLocations.map(...)` children in `src/screens/map.screen.js:40-48,331` with a single `useMemo` producing the `MapMarker[]` array, keyed on `partnerLocations` alone (FR-003, `data-model.md` E2). Delete `PartnerMarker`, its `displayName`, and the now-redundant `tracksViewChanges` workaround
- [X] T021 [US2] Replace the controlled `camera` `useMemo` at `src/screens/map.screen.js:247` with a one-shot `initialCamera` plus ref-driven `setCamera` calls, removing the competition between the declarative prop and the imperative `animateCamera` calls (FR-006, `research.md` R8.3)
- [X] T022 [US2] Rewrite `handleCenter` (`src/screens/map.screen.js:146`) and `handlePartnerCentre` (`:186`) to call `platformMapRef.current.setCamera(...)`. Note Apple ignores animation duration and moves instantly (`contracts/platform-map.md`) — accept the asymmetry, do not shim it
- [X] T023 [US2] Rewrite marker selection in `src/screens/map.screen.js` to consume `onMarkerPress(markerId)` and resolve it back to the partner via `String(p.id) === markerId` (`data-model.md` E4). A lookup miss must be a no-op, not a crash
- [ ] T024 [US2] Verify against `quickstart.md` Gate 3 on both platforms and compare frame rates to the T002 baseline (NFR-001). Then re-run Gate 1 and Gate 2 — the migration must not reopen US1's defect or break partner selection
  - ⚠️ **BLOCKED — requires physical devices.**

**Checkpoint**: The main map runs on `expo-maps` on both platforms. `map.component.js` is still on
`react-native-maps`, so both libraries are installed at this point — expected and temporary.

---

## Phase 5: User Story 3 — The location preview still works everywhere it appears (Priority: P2)

**Goal**: Migrate the static preview onto the same wrapper without changing its public API or
breaking its two consumers.

**Independent Test**: Open an event detail and a location view. The preview shows the right
coordinates, does not pan or zoom, keeps its rounded top corners, and a finger-drag starting on the
map scrolls the parent screen.

### Implementation for User Story 3

- [X] T025 [US3] Rewrite `src/components/map/map.component.js` to render `<PlatformMap interactive={false}>`, keeping the existing `{ lat, lng, zoom }` prop signature exactly (FR-007) so `eventDetail.screen.js:19` and `location-view.screen.js:25` need no changes
- [X] T026 [US3] Replace the current `pointerEvents="none"` with `interactive={false}` in `src/components/map/map.component.js`. **This is the regression risk in this story** — verify a drag starting on the map still scrolls the parent (FR-008)
- [X] T027 [US3] Preserve the existing container styling in `src/components/map/map.component.js` — 250pt height, rounded top corners, `overflow: hidden` — using module-scope `StyleSheet.create` (PR-004)
- [ ] T028 [US3] Verify against `quickstart.md` Gate 4 on both platforms, exercising both consumer screens
  - ⚠️ **BLOCKED — requires physical devices.**

**Checkpoint**: Both map surfaces run on `expo-maps`. `react-native-maps` is now unreferenced.

---

## Phase 6: User Story 4 — The app no longer carries two map libraries (Priority: P3)

**Goal**: Remove the old library and prove the single-import rule holds.

**Independent Test**: `grep -rn "react-native-maps" src/` returns nothing;
`grep -rn 'from "expo-maps"' src/` returns exactly one file.

### Implementation for User Story 4

- [X] T029 [US4] Confirm no source references remain: `grep -rn "react-native-maps" src/` must return nothing before uninstalling
- [X] T030 [US4] Uninstall the old library: `npm uninstall react-native-maps` (FR-010)
- [X] T031 [US4] Verify the single-import rule from `contracts/platform-map.md`: `grep -rn 'from "expo-maps"' src/` returns exactly `src/components/map/platformMap.component.js` (FR-009)
- [X] T032 [US4] Re-run `npx expo prebuild --clean` and confirm the native projects no longer link the Google Maps iOS SDK

**Checkpoint**: One map library. All four stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T033 [P] Re-run every repo gate: `npm test`, `npm run lint`, `npm run check:styles`, `npm run check:screen-props`, `npm run check:animation`, `npm run audit:lists` (NFR-002)
- [X] T034 [P] Export both platform bundles and confirm no resolution errors: `npx expo export --platform ios` and `--platform android` (NFR-003)
- [ ] T035 Run `quickstart.md` end to end — all six gates, both platforms, on physical devices
  - ⚠️ **BLOCKED — requires physical devices.**
- [ ] T036 **Gate 5 specifically**: confirm the built iOS app reports `MinimumOSVersion` 17.0 and, if an iOS 16 device is available, that installation is refused rather than showing a blank map (SC-006). This is the migration's critical risk and the only check that proves it was mitigated
  - ⚠️ **PARTIAL.** Build config verified: `ios.deploymentTarget: "17.0"` in `ios/Podfile.properties.json`, `IPHONEOS_DEPLOYMENT_TARGET = 17.0` ×2 in the pbxproj. The iOS 16 install-refusal test requires a device.
- [ ] T037 Resolve the open question in `plan.md`: whether the iOS SF-Symbol marker is acceptable in place of the branded pin, or whether Android's pin should be downgraded to match (`research.md` R5). Product decision, not a code change
  - ⚠️ **OPEN — product decision, not an implementation task.**
- [ ] T038 [P] Record the before/after frame-rate numbers from T002 and T024 in the PR description so the performance claim in SC-002 is a measurement rather than an impression
  - ⚠️ **BLOCKED — depends on T002 and T024.**

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies. T002 must complete before T004 — the baseline is unrecoverable afterwards
- **Foundational (Phase 2)**: deliberately empty; blocks nothing
- **US1 (Phase 3)**: depends only on Setup. **Independently shippable**
- **US2 (Phase 4)**: depends on Setup. Technically independent of US1, but US1 should land first — it is P1, it is smaller, and T004–T007 delete code that US2 would otherwise migrate pointlessly
- **US3 (Phase 5)**: depends on US2 (T014–T018 create the wrapper it consumes)
- **US4 (Phase 6)**: depends on US2 **and** US3 — `react-native-maps` cannot be removed while either surface still imports it
- **Polish (Phase 7)**: depends on all stories

### Story Dependency Graph

```text
Setup ──→ US1 (P1) ──────────────────────────────→ shippable alone
    │
    └───→ US2 (P2) ──→ US3 (P2) ──→ US4 (P3) ──→ Polish
              │            │
              └── wrapper ─┘
```

### Within US2

T010 → T011 → T013 (install, then target, then prebuild) is strictly sequential.
T014 → T015/T016/T017 → T018 (wrapper skeleton, then behaviour, then contract audit).
T019–T023 all edit `src/screens/map.screen.js` and must be sequential.

### Parallel Opportunities

- **T003** runs alongside T001/T002
- **T012** is parallel with T011 (different files: `app.json` vs `ios/Podfile.properties.json`)
- **T033, T034, T038** are parallel in Polish
- **US1 and the T010–T013 groundwork of US2** can proceed in parallel with two people: different files entirely, no shared edits
- **Nothing inside T019–T023 is parallel** — one file, sequential edits
- **US3 cannot parallelise with US2**, it consumes US2's wrapper

## Implementation Strategy

### MVP scope

**US1 alone (T001–T009).** Nine tasks, one file, no new dependency, no iOS version change. It closes
the reported bug — the my-location button — and removes the bogus viewport projection that was
degrading every gesture. Ship it before starting the migration.

### Incremental delivery

1. **US1** → the bug is fixed. Release.
2. **US2** → main map on `expo-maps`, iOS on Apple Maps, 100 pins as one array. Release behind the iOS 17 floor.
3. **US3** → preview migrated. Both surfaces consistent.
4. **US4 + Polish** → old library removed, `quickstart.md` run end to end.

Steps 2–4 are one release in practice: US4 is the cleanup that makes US2/US3 worth having, and
shipping with both libraries installed carries the native weight of both.

### Rollback

US1 is a self-contained revert. US2–US4 are native dependency changes and **cannot be undone by an
OTA update** — a revert requires a full rebuild and resubmission. Do not revert US1 alongside them;
those fixes stand on their own.
