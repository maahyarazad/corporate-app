# Contract: `platformMap.component.js`

**Feature**: 010-expo-maps | **Phase 1**

The one place in the app that knows `expo-maps` has two different components.
Both map surfaces consume this; neither imports `expo-maps` directly.

**Path**: `src/components/map/platformMap.component.js`

---

## Why this component exists

`AppleMaps.View` and `GoogleMaps.View` are separate exports with non-identical
prop types (`research.md` R3). expo-maps is also pre-1.0 and expected to break
(`research.md` R6). Confining both facts to one file means a breaking upgrade is
a one-file diff, and the platform divergence is written down once instead of
twice.

**Rule**: `import ... from "expo-maps"` may appear in exactly one file in
`src/`. Worth a `check:` script if this survives contact with reality.

---

## Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `markers` | `MapMarker[]` | yes | See `data-model.md` E2. Caller must memoise. |
| `initialCamera` | `CameraPosition` | yes | One-shot. Later changes are ignored by design — use the ref. |
| `onMarkerPress` | `(markerId: string) => void` | no | Narrowed from the native record to the id alone. |
| `showsUserLocation` | `boolean` | no, default `true` | → `properties.isMyLocationEnabled` on both platforms. |
| `showsMyLocationButton` | `boolean` | no, default `true` | → `uiSettings.myLocationButtonEnabled` on both platforms. |
| `interactive` | `boolean` | no, default `true` | `false` makes the map non-interactive. **Implemented with `pointerEvents="none"` on the wrapping `View`, not with `uiSettings`** — see the correction below. |
| `style` | RN style | yes | Must come from a `StyleSheet` — `check:styles` forbids inline literals. |

### Deliberately absent

- **`mapPadding`** — no equivalent is exposed, and none should be. This is the
  prop that made the my-location button untappable on iOS
  (`research.md` R8.1). Not porting it is a decision, not an oversight.
- **`followsUserLocation`** — was a no-op in the current code
  (`research.md` R8.2). Not reintroduced.
- **Controlled camera** — see `initialCamera` above and `research.md` R8.3.

---

### Correction found during implementation (2026-09-08)

The plan assumed `interactive={false}` could be expressed through `uiSettings`
on both platforms. It cannot. `AppleMapsUISettings` exposes exactly four flags —
`compassEnabled`, `myLocationButtonEnabled`, `scaleBarEnabled`,
`togglePitchEnabled` — and `AppleMapsViewProps` has no `scrollEnabled` /
`zoomEnabled` of any kind. **There is no declarative way to disable gestures on
the Apple side.**

`interactive={false}` is therefore implemented as `pointerEvents="none"` on the
wrapping `View`, on both platforms. Android additionally receives the real
gesture flags (`scrollGesturesEnabled` and friends) as belt and braces. This
also happens to be the mechanism that most directly guarantees FR-008 — a drag
starting on the preview reaches the parent scroll view rather than being
swallowed by the map — which is what the original `map.component.js` relied on.

### Android chrome defaults (added 2026-09-08)

Three `GoogleMapsUISettings` flags default to `true` upstream
(`expo-maps/android/.../Records.kt:161-177`) and are opted out of here:

| Flag | Why off |
|---|---|
| `mapToolbarEnabled` | Google's toolbar slides up on marker tap with "directions" / "open in Maps" — duplicates the partner card's own Get Directions and renders on top of it |
| `zoomControlsEnabled` | +/- buttons pinned bottom-right, directly under the partner card; pinch already works |
| `indoorLevelPickerEnabled` | A floor picker for indoor maps, which are off anyway |

`isBuildingEnabled`, `isIndoorEnabled` and `isTrafficEnabled` already default to
`false` (`Records.kt:220-226`). They are set explicitly anyway — not as a saving,
but because this is an alpha library and a flipped default is a plausible
upgrade surprise.

Settings objects are built per platform. None of the Android keys above exist on
`AppleMapsUISettings`, and handing an alpha native component undeclared props is
not worth the risk.

## Imperative handle (`ref`)

```
setCamera(position: CameraPosition, durationMs?: number): void
```

Delegates to the platform view's `setCameraPosition`.

**`durationMs` is advisory.** Android honours it; iOS ignores it and moves
instantly (`AppleMaps.types.d.ts:434`). The parameter is accepted rather than
dropped so Android keeps its animation, and the asymmetry is documented rather
than hidden behind a fake parity shim.

---

## Behavioural contract

1. **Marker identity** — `markers[].id` is a string and round-trips unchanged
   through `onMarkerPress`. Callers convert back to their own key type.
2. **Invalid coordinates** — markers with a non-finite `latitude`/`longitude`
   are dropped before reaching native, not passed through (`data-model.md` E1).
3. **Uncontrolled camera** — after mount, the camera moves only via the ref or
   the user's own gestures. `initialCamera` changes do not re-seed it.
4. **Prop identity** — the component does not defensively copy `markers`. A
   caller handing a fresh array each render re-serialises every marker; that is
   the caller's bug and the contract says so.
5. **iOS floor** — on iOS below 17 the underlying view renders blank
   (`research.md` R2). The component does not detect or paper over this; the
   deployment target is the mitigation.

---

## Consumers

| File | Usage |
|---|---|
| `src/screens/map.screen.js` | Full interactive map, 100 markers, ref-driven camera |
| `src/components/map/map.component.js` | Static single-pin preview, `interactive={false}` |

`map.component.js` keeps its existing public shape — `{ lat, lng, zoom }` — so
`src/screens/events/eventDetail.screen.js:19` and
`src/screens/location/location-view.screen.js:25` need no changes.

---

## Verification

No automated coverage is possible: there is no component-test or
visual-regression harness in this repo (`research.md` R9). Every clause above is
checked by hand against `quickstart.md`, on both platforms.
