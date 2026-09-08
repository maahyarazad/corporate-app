# Feature Specification: expo-maps Migration & Map Optimisation

**Feature Branch**: `010-expo-maps`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "010 use expo-maps in the map.screen.js and optimiza the map in both IOS and ANdroid"

> **Note on provenance**: this spec was written *after* `plan.md`, to formalise the user stories that
> `/speckit-tasks` requires — the same order `005` and `009` used. It restates the plan's phases as
> testable slices and introduces no new scope. `plan.md`, `research.md`, `data-model.md` and
> `contracts/platform-map.md` remain the authority on mechanism.

## Summary

Replace `react-native-maps@1.20.1` with Expo's first-party `expo-maps` across both map surfaces, and
fix four defects currently degrading the main map screen.

The request bundles two things that are worth separating, because one is shippable today and the
other is gated on a platform decision:

- **The reported bug.** The my-location button on iOS is visible but does not respond to taps. The
  cause is a `mapPadding` prop that also forces every gesture and camera animation through an 80pt
  viewport. This is fixable in place, on the current library, with no migration.
- **The performance goal.** `react-native-maps` renders each of the 100 partner pins as a React
  child backed by a native view. `expo-maps` takes markers as a declarative array prop instead, and
  on iOS moves the app from Google's iOS SDK to native Apple Maps.

### The iOS 17 decision (resolved)

`expo-maps` renders a **silently blank map** on iOS below 17 — `AppleMaps.View` falls through to
`EmptyView()` with no error, no warning, and no fallback (`research.md` R2). The podspec still
advertises `:ios => '15.1'`, so nothing catches it at build time either.

**Decision: raise the iOS deployment target to 17.0.** Confirmed 2026-09-08. This drops every iOS 15
and iOS 16 device; the App Store will refuse installation on them, which is the safe failure mode
compared with shipping a blank screen. This decision is what unblocks US2, US3 and US4.

### What this feature does not claim

**No visual parity between platforms.** `expo-maps` allows only SF Symbols for markers on iOS
(`systemImage` + `tintColor`); a branded pin image is Android-only (`research.md` R5). Apple Maps
cartography also differs from Google's. Both are accepted, not worked around.

**No clustering.** `expo-maps` has none at any zoom level. Acceptable at 100 pins; a hard ceiling if
the partner count grows.

**No automated verification.** Jest here covers pure logic only — no component harness, no visual
regression, nothing touching a map. Every acceptance criterion below is verified by hand, on device,
on both platforms, per `quickstart.md`.

### Evidence supplied

| Finding | Location | Verified against |
|---|---|---|
| `AppleMaps.View` is `EmptyView()` below iOS 17 | `research.md` R2 | `expo-maps@0.12.10` `ios/AppleMapsView.swift:33-59` |
| Current iOS target is 15.1 | `research.md` R2 | `ios/Podfile:19`, unoverridden |
| `expo-maps@0.12.x` is the SDK 54 line | `research.md` R1 | published version list: `0.x` ends at `0.12.10`, then `55.0.0` |
| Two components, divergent props | `research.md` R3 | `build/index.d.ts`, both `*.types.d.ts` |
| Markers are a data prop, not children | `research.md` R4 | `markers?: GoogleMapsMarker[]` / `AppleMapsMarker[]` |
| Marker identity round-trips via `id` | `data-model.md` E4 | `id?: string` on both marker records |
| No clustering exists | `research.md` R5 | `grep -r cluster build/` → no matches |
| Android still needs its Google Maps key | `research.md` R7 | `plugin/src/index.ts` handles permissions only |
| `mapPadding` breaks iOS hit-testing | `research.md` R8.1 | `AIRGoogleMap.m:442`, `:461` |
| `followsUserLocation` is a no-op | `research.md` R8.2 | implemented only in `AIRMapManager.m:90` |

## User Scenarios & Testing

### User Story 1 — The my-location button works on iOS (Priority: P1)

A member opens the map, pans away from their position, and taps the my-location button. The map
recentres on them.

Today the button renders but is inert. `mapPadding={{ top: screenHeight - 80, ... }}`
(`map.screen.js:70`, passed at `:327`) is assigned straight to `GMSMapView.padding`, which is the
region the Google Maps iOS SDK lays its controls out in. An 80pt sliver plus the default
`paddingAdjustmentBehaviorAlways` inverts the rect, and the button's hit area lands outside the
map's bounds.

**Why P1**: it is the bug that prompted the feature, it is user-visible, and it is fixable without
the migration or the iOS 17 floor — so it ships first and independently.

**Independent test**: on an iOS device, tap the my-location button after panning away. The camera
recentres. Repeat on Android.

### User Story 2 — The map stays smooth with all partner pins loaded (Priority: P2)

A member pans and pinch-zooms around a city with 100 partner pins on screen. The map tracks their
gestures without stutter, on both platforms.

Two independent causes are addressed. `mapPadding` feeds the camera projection, so every gesture is
currently computed against an 80pt-tall viewport (fixed in US1). And each pin is a native view with
its own lifecycle — replaced by a single serialised marker array under `expo-maps`
(`research.md` R4).

**Why P2**: this is the "optimise" half of the request. It depends on the iOS 17 decision and on the
wrapper component, so it cannot ship before US1.

**Independent test**: with all pins loaded, fling and pinch-zoom repeatedly; no visible stutter and
no progressive slowdown after ten select/dismiss cycles. Capture JS/UI frame rates before and after
so the claim is a number, not a feeling.

### User Story 3 — The location preview still works everywhere it appears (Priority: P2)

A member opens an event detail or a location view and sees the static map preview at the right
coordinates, with rounded top corners, that does not swallow their scroll gesture.

`map.component.js` is consumed by `eventDetail.screen.js:19` and `location-view.screen.js:25`. It
must migrate alongside the main screen because both consume the same wrapper, and its public
`{ lat, lng, zoom }` prop shape must not change.

**Why P2**: ships with US2 — the wrapper cannot be half-adopted. Called out separately because it is
the regression most likely to be missed: the preview currently disables interaction with
`pointerEvents="none"`, and the replacement disables gestures individually.

**Independent test**: open both consumer screens; the preview is at the correct location, does not
pan or zoom, and a finger-drag starting on the map scrolls the parent screen.

### User Story 4 — The app no longer carries two map libraries (Priority: P3)

A developer greps the source for `react-native-maps` and finds nothing. `expo-maps` is imported in
exactly one file.

**Why P3**: pure maintenance. It has no user-visible effect, but leaving both libraries installed
doubles the native surface and defeats the point of the migration.

**Independent test**: `grep -rn "react-native-maps" src/` returns nothing;
`grep -rn 'from "expo-maps"' src/` returns exactly one file; both platform bundles export cleanly.

## Requirements

### Functional

- **FR-001**: The my-location button MUST recentre the camera on the user's position on both platforms.
- **FR-002**: The `mapPadding` prop MUST NOT be reintroduced in any form (`contracts/platform-map.md`).
- **FR-003**: Partner markers MUST be supplied as a memoised data array, not as React children.
- **FR-004**: Marker taps MUST resolve to the correct partner; "View Offer" MUST navigate to that partner's id.
- **FR-005**: Markers with non-finite coordinates MUST be filtered before reaching native.
- **FR-006**: The camera MUST be uncontrolled after mount — imperative moves plus a one-shot initial position.
- **FR-007**: `map.component.js` MUST keep its `{ lat, lng, zoom }` public prop shape.
- **FR-008**: The static preview MUST NOT capture scroll gestures belonging to its parent screen.
- **FR-009**: `expo-maps` MUST be imported in exactly one file under `src/`.
- **FR-010**: `react-native-maps` MUST be removed from `package.json` on completion.

### Platform & configuration

- **PR-001**: `ios.deploymentTarget` MUST be `"17.0"` in `ios/Podfile.properties.json`.
- **PR-002**: The Android Google Maps API key at `app.json:124` MUST be retained (`research.md` R7).
- **PR-003**: `expo.ios.config.googleMapsApiKey` MUST be removed — iOS runs on Apple Maps.
- **PR-004**: All map styles MUST come from module-scope `StyleSheet.create` (`check:styles`).

### Non-functional

- **NFR-001**: No regression in map interaction smoothness on either platform, measured before/after.
- **NFR-002**: All repo gates stay green: `npm test`, `lint`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`.
- **NFR-003**: Both platform bundles MUST export without error.

## Success Criteria

- **SC-001**: The my-location button responds to taps on iOS — the originally reported defect is closed.
- **SC-002**: 100 partner pins render and remain interactive with no visible stutter on both platforms.
- **SC-003**: Marker tap → detail card → "View Offer" resolves to the correct partner every time.
- **SC-004**: Both static-preview consumers render correctly and do not capture parent scroll.
- **SC-005**: The app ships with exactly one map library.
- **SC-006**: iOS builds refuse to install below iOS 17 rather than presenting a blank map.

## Out of Scope

- Marker clustering (unsupported by `expo-maps`).
- Offline tile caching.
- Changes to the partner coordinates API or its 100-record ceiling.
- Visual parity of marker pins between iOS and Android.
- Custom map styling / branded cartography.
