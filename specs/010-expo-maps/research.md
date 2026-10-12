# Phase 0 Research: expo-maps Migration

**Feature**: 010-expo-maps | **Date**: 2026-09-08

All findings below were verified against the actual package source
(`expo-maps@0.12.10`, unpacked and read) and against this repo's working tree
at `596e2ae`. Nothing here is from memory or documentation.

---

## R1. Which expo-maps version pairs with Expo SDK 54

**Decision**: `expo-maps@~0.12.10`.

**Evidence**: the published stable version list has a `0.x` line ending at
`0.12.10`, after which it jumps straight to `55.0.x`. expo-maps switched to
SDK-aligned versioning at SDK 55, so `55.x` = SDK 55, `56.x` = SDK 56, `57.x` =
SDK 57. This project is on SDK 54 (`package.json` `expo.sdkVersion`), so the
`0.12.x` line is the correct one. Install with `npx expo install expo-maps` so
the version map resolves it rather than pinning by hand.

**Consequence**: this is the *last* release of the pre-alignment line. Any future
Expo SDK upgrade moves expo-maps by a whole major, and the API is not yet
stable (see R6).

---

## R2. AppleMaps requires iOS 17 — and fails silently below it

**This is the single most important finding in this document.**

`expo-maps` does not render one map component. It exposes two:
`AppleMaps.View` (iOS, SwiftUI MapKit) and `GoogleMaps.View` (Android). The
Apple side is gated on iOS 17:

```swift
// ios/AppleMapsView.swift:33-42
init(props: AppleMapsViewProps) {
  self.props = props
  if #available(iOS 18.0, *)      { appleMapsView = AppleMapsViewiOS18() }
  else if #available(iOS 17.0, *) { appleMapsView = AppleMapsViewiOS17() }
  else                            { appleMapsView = nil }
}

// ios/AppleMapsView.swift:52-59
var body: some View {
  if #available(iOS 18.0, *), let v = appleMapsView as? AppleMapsViewiOS18 { ... }
  else if #available(iOS 17.0, *), let v = appleMapsView as? AppleMapsViewiOS17 { ... }
  else { EmptyView() }
}
```

On iOS 16 and below the map is `EmptyView()` — **a blank rectangle, with no
error, no warning, and no fallback.** The podspec advertises `:ios => '15.1'`,
so nothing fails at build time either. The failure is invisible until a user on
an older device opens the screen.

This repo's current deployment target is **iOS 15.1** (`ios/Podfile:19`,
unoverridden — `ios/Podfile.properties.json` has no `ios.deploymentTarget`).

**Decision**: raise `ios.deploymentTarget` to `"17.0"` in
`ios/Podfile.properties.json` via `expo-build-properties`, so the App Store
refuses installation on unsupported devices rather than shipping them a blank
screen.

**This is a product decision, not a technical one.** It drops every iOS 15 and
iOS 16 device. It needs an answer from the business before implementation
starts — see the open question in `plan.md`.

**Alternative considered and rejected**: keep the target at 15.1 and
`Platform.Version`-gate the screen, falling back to react-native-maps below
iOS 17. Rejected because it means shipping and maintaining *both* map stacks
indefinitely — strictly worse than either one alone.

---

## R3. Two components, two prop types — the screen must platform-split

`AppleMaps.View` and `GoogleMaps.View` are separate exports with separate,
non-identical prop types (`build/index.d.ts`). They are not a single
cross-platform `<MapView>` the way `react-native-maps` is. Divergences that
matter here:

| Capability | `GoogleMaps.View` (Android) | `AppleMaps.View` (iOS) |
|---|---|---|
| User-location dot | `properties.isMyLocationEnabled` | `properties.isMyLocationEnabled` |
| My-location button | `uiSettings.myLocationButtonEnabled` | `uiSettings.myLocationButtonEnabled` |
| `userLocation` prop | yes | **absent** |
| Camera animation duration | supported | **not supported** (`AppleMaps.types.d.ts:434` — "Animation duration is not supported on iOS") |
| Custom marker image | `icon?: SharedRefType<'image'>` | **no** — `systemImage` (SF Symbol) + `tintColor` only |
| POI taps | `onPOIClick` | absent |

**Decision**: a single `src/components/map/platformMap.component.js` that owns
the `Platform.OS` branch and normalises one prop shape for both screens. The
two consumers (`map.screen.js`, `map.component.js`) must not each grow their
own platform fork.

---

## R4. Markers become a data prop — this is the real performance win

`react-native-maps` renders markers as React children; each `<Marker>` is a
native view, and this screen mounts **100** of them (`map.screen.js:125`,
`getCoordinates(100)`). That is the source of the reported lag, and it is why
the current code needs `tracksViewChanges={false}` (`map.screen.js:42`) as a
mitigation.

expo-maps takes markers as a **declarative array prop** — `markers?:
GoogleMapsMarker[]` / `AppleMapsMarker[]` — serialised across the bridge once
per change. No per-marker React element, no per-marker native view lifecycle,
no `tracksViewChanges` footgun.

Marker identity survives the round trip: both marker records carry
`id?: string`, documented as "can be used to identify the clicked marker in the
`onMarkerClick` event", and `onMarkerClick` hands back the whole marker record.
So the existing tap → partner-detail-card flow maps over cleanly.

**Consequence**: the memoisation currently carrying this screen
(`React.memo` on `PartnerMarker`, the hoisted `onSelect` callback) becomes
unnecessary. One `useMemo` producing the marker array replaces it.

---

## R5. No clustering, and no custom pin images on iOS

Grepping the entire built package for `cluster` returns nothing. expo-maps has
no clustering at any zoom level. At 100 markers in one metro area this is
acceptable; it is a hard ceiling if the partner count grows.

On iOS, markers can only be SF Symbols with a tint (`systemImage`,
`tintColor`). A branded pin PNG is not possible on the Apple side. Android
accepts a real image via `icon`.

**Decision**: accept visual divergence between platforms for this migration.
Use a neutral SF Symbol on iOS and the matching brand pin on Android. Do not
attempt to force parity.

---

## R6. Stability posture

expo-maps is still pre-1.0 on this SDK line and Expo documents it as subject to
breaking changes. Concretely, migrating means:

- trading a mature third-party library (`react-native-maps@1.20.1`, years of
  releases) for a first-party one that is explicitly not API-stable;
- gaining native Apple Maps on iOS, which is materially smoother than Google's
  iOS SDK and needs no API key;
- keeping the Android Google Maps key — see R7.

This is a real trade, not a free upgrade. It belongs in the spec's rationale.

---

## R7. The Android Google Maps API key is still required

The expo-maps config plugin (`plugin/src/index.ts`, read in full) does exactly
one thing: it adds location permissions, and only when
`requestLocationPermission` is passed. It does **not** wire the Google Maps API
key.

Android therefore still reads `expo.android.config.googleMaps.apiKey` from
`app.json` — which is present at `app.json:124`. **Do not remove it.** iOS no
longer needs `expo.ios.config.googleMapsApiKey`, because iOS is on Apple Maps;
that one can go.

Location permissions already resolve correctly through expo-location's plugin
(`ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` both appear in the
introspected manifest), so the expo-maps plugin does not need to be configured
for permissions at all.

---

## R8. Defects in the current screen that this migration must not carry forward

These were diagnosed against the working tree and are live at `596e2ae`. They
are the "optimise" half of the request and are worth fixing independently of
which library wins.

### R8.1 `mapPadding` makes the my-location button untappable on iOS

`map.screen.js:70` computes `{ top: screenHeight - 80, right: 0, bottom: 0,
left: 0 }` and passes it at line 327. On iOS, `AIRGoogleMap` subclasses
`GMSMapView` and assigns this straight to `GMSMapView.padding`
(`AIRGoogleMap.m:442`). In the Google Maps iOS SDK, padding defines the region
the UI controls are laid out in — the my-location button anchors to its
bottom-right. An 80pt sliver, plus the default
`paddingAdjustmentBehaviorAlways` (`AIRGoogleMap.m:461`) adding safe-area
insets on top, inverts the rect. The button draws but its hit area falls
outside the map's bounds.

The padding also feeds the camera projection, so every gesture and animation on
this screen is being computed against an 80pt-tall viewport. It contributes to
the lag independently of the marker count.

**This prop should be deleted, not ported.** Its intent is not recoverable from
the diff that introduced it (`31f4bff`).

### R8.2 `followsUserLocation` is a no-op

`map.screen.js:325`. Implemented only in `AirMaps` (Apple Maps,
`AIRMapManager.m:90`). No such property exists in `AirGoogleMaps` or in the
Android sources. With `provider="google"` it does nothing on either platform.

### R8.3 The camera is controlled and fights the user

`map.screen.js:247` memoises a `camera` object and passes it as a controlled
prop while `animateCamera` is also called imperatively (lines 148, 186). A
controlled camera re-asserts itself on prop change; the two mechanisms compete.
expo-maps' `setCameraPosition` ref method plus an uncontrolled initial
`cameraPosition` avoids this by construction.

### R8.4 `styles.map` sets both `flex: 1` and `height: '90%'`

Inert today (flexBasis wins on the main axis) but contradictory, and it will
bite if the parent's flex direction ever changes.

---

## R9. Testing reality

Jest here covers pure logic only; there is no component or visual-regression
harness, and no map surface is under test. **Every acceptance criterion in this
feature is verified manually, on device, on both platforms.** The plan must not
pretend otherwise.

Repo gates that must stay green: `npm test`, `check:styles`,
`check:screen-props`, `check:animation`, `audit:lists`.

---

## Summary of decisions

| # | Decision | Confidence |
|---|---|---|
| R1 | `expo-maps@~0.12.10` for SDK 54 | High — version list verified |
| R2 | Raise iOS target to 17.0 | High on mechanism; **needs business sign-off** |
| R3 | Single platform-splitting wrapper component | High |
| R4 | Markers as a data prop; drop per-marker memoisation | High |
| R5 | Accept iOS/Android pin divergence | Medium — a product call |
| R6 | Accept pre-1.0 API instability | **Needs sign-off** |
| R7 | Keep the Android key, drop the iOS one | High — plugin source read |
| R8 | Fix the four current defects as part of this work | High |
