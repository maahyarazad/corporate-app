# Phase 1 Data Model: expo-maps Migration

**Feature**: 010-expo-maps | **Date**: 2026-09-08

This feature adds no persistence and no new API. The "data model" here is the
set of shapes crossing the JS↔native boundary, and how the existing partner
records map onto them.

---

## E1. `PartnerLocation` — the source record (unchanged)

Returned by `GET /v2/partner/coordinates/{count}`, fetched at
`src/screens/map.screen.js:125` with `count = 100`.

| Field | Type | Used for |
|---|---|---|
| `id` | number | Marker identity; `locId` route param for "View Offer" |
| `lat` | number | Marker latitude |
| `lng` | number | Marker longitude |
| `title` | string | Detail-card heading; marker callout title |
| `file` | string | Detail-card image, resolved against `adminFileBaseURL` |

**Validation**: records with a null/undefined `lat` or `lng` must be filtered
out before mapping. `react-native-maps` tolerated bad coordinates by dropping
the marker; expo-maps serialises the whole array in one pass, and a malformed
entry risks the batch. Filtering is new work this migration requires.

---

## E2. `MapMarker` — the normalised marker (new)

The wrapper component's platform-neutral marker. One per valid
`PartnerLocation`.

```
{
  id:          string      // String(partner.id) — expo-maps requires string ids
  coordinates: { latitude: number, longitude: number }
  title:       string
}
```

**Why `id` is a string**: both `GoogleMapsMarker.id` and `AppleMapsMarker.id`
are typed `id?: string`. The partner `id` is a number, so the conversion is
explicit at the boundary — and must be converted *back* on tap (see E4).

### Platform projection

`platformMap.component.js` maps `MapMarker` onto whichever native record the
platform needs:

| `MapMarker` | → `GoogleMapsMarker` (Android) | → `AppleMapsMarker` (iOS) |
|---|---|---|
| `id` | `id` | `id` |
| `coordinates` | `coordinates` | `coordinates` |
| `title` | `title` | `title` |
| — | `icon` (brand pin image) | `systemImage` + `tintColor` (SF Symbol) |

The icon divergence is the one documented in `research.md` R5 and is deliberate.

**Identity/memoisation rule**: the marker array must be memoised on
`partnerLocations` alone. It is a native-bound prop; a fresh array identity on
every render re-serialises 100 records across the bridge. This is the same
class of mistake the `mapPadding` object made (`research.md` R8.1).

---

## E3. `CameraPosition` — viewport state

```
{
  coordinates: { latitude: number, longitude: number }
  zoom:        number
}
```

Three producers, all funnelling through the wrapper:

| Trigger | Source | Behaviour |
|---|---|---|
| Initial frame | `myLocation` from `LocationContext` | Uncontrolled — set once as the initial `cameraPosition` |
| My-location tap | `myLocation` | `setCameraPosition` via ref |
| Partner tap | selected partner, `lat` offset by `-0.005` | `setCameraPosition` via ref |

**Uncontrolled by design.** The current screen passes a controlled `camera`
prop (`map.screen.js:247`) *and* calls `animateCamera` imperatively (lines 148,
186); the two compete (`research.md` R8.3). The wrapper exposes only the
imperative path plus a one-shot initial position.

**Platform divergence**: Apple ignores animation duration
(`AppleMaps.types.d.ts:434`). Camera moves are instant on iOS, animated on
Android. The wrapper accepts a duration and lets iOS drop it rather than
pretending parity.

---

## E4. `PartnerSelection` — tap → detail card

`onMarkerClick` returns the full native marker record, not an index. The
wrapper narrows it to the marker `id` and the screen resolves that back to the
partner:

```
onMarkerClick(marker) → marker.id (string)
                      → partnerLocations.find(p => String(p.id) === marker.id)
                      → locationState { locationId, locationName, locationImage, lat, lng }
```

**Validation**: the lookup can miss if the marker array and `partnerLocations`
have drifted. A miss must be a no-op, not a crash — the current code path
assumes the partner always exists.

The existing `locationState` shape and the `showPartnerDetails` flag are
unchanged; the detail card, distance calculation, "Get Directions" and "View
Offer" all keep working off the same state.

---

## E5. State transitions (unchanged from current behaviour)

```
mount
  ├─ getUserLocation()      → myLocation set  ─┐
  └─ GET partner/coordinates → partnerLocations ┴→ map renders (both required)

map idle ──marker tap──→ partner selected ──┬──"View Offer"──→ Location View screen
    ↑                    (card visible)     ├──"Get Directions"→ native maps app
    └────────back────────────────────────────┘
```

The `partnerLocations && myLocation` render gate at `map.screen.js:318` is
retained: expo-maps needs an initial camera position, and `myLocation` is what
provides it.

---

## Non-goals

- No clustering (`research.md` R5) — not supported by expo-maps at any zoom.
- No offline tile caching.
- No change to the partner coordinates API or its 100-record ceiling.
