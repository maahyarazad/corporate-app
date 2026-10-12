# Quickstart: Validating the expo-maps Migration

**Feature**: 010-expo-maps | **Phase 1**

There is no automated coverage for any of this. Jest here tests pure logic only
— no component harness, no visual regression, nothing touching a map
(`research.md` R9). **This runbook is the acceptance gate.** Run it end to end
on both platforms before merging.

---

## Prerequisites

- A physical device or simulator per platform. **iOS must be 17.0+** — below
  that the map renders blank with no error (`research.md` R2).
- Location permission grantable; the screen gates on it (`map.screen.js:278`).
- Android: the Google Maps API key at `app.json:124` must still be present
  (`research.md` R7).
- A native rebuild. This is a native dependency change — **OTA will not carry
  it**.

```bash
npx expo prebuild --clean
npx expo run:ios      # or: npx expo run:android
```

---

## Gate 0 — mechanical checks

Must be green before any manual testing.

```bash
npm test
npm run lint
npm run check:styles
npm run check:screen-props
npm run check:animation
npm run audit:lists
```

Then confirm the import rule from `contracts/platform-map.md`:

```bash
# expect exactly one hit: src/components/map/platformMap.component.js
grep -rn "from \"expo-maps\"" src/

# expect no hits — the old library must be fully gone after Phase C
grep -rn "react-native-maps" src/
```

And that the bundle still builds:

```bash
npx expo export --platform ios --output-dir /tmp/export-check
npx expo export --platform android --output-dir /tmp/export-check-android
```

---

## Gate 1 — the reported defect (Phase A; re-verify after C)

This is the bug that started the feature. **iOS specifically.**

| # | Step | Expected |
|---|---|---|
| 1.1 | Open the map screen on iOS | Map renders, user dot visible |
| 1.2 | Locate the my-location button | Visible |
| 1.3 | **Tap it** | **Camera recentres on the user.** Before this feature it was visible but inert (`research.md` R8.1) |
| 1.4 | Pan far away, tap again | Recentres again |
| 1.5 | Repeat 1.1–1.4 on Android | Same behaviour |

Gate 1.3 failing means the feature has not delivered its headline fix.

---

## Gate 2 — markers and selection

| # | Step | Expected |
|---|---|---|
| 2.1 | Open the map | Partner pins render; count matches the API response |
| 2.2 | Tap a pin | Detail card appears with the **correct** name and image |
| 2.3 | Check the distance | Non-zero KM, plausible for the pin |
| 2.4 | Tap "View Offer" | Navigates to Location View for **that** partner — not id `0` |
| 2.5 | Tap "Get Directions" | Native maps app opens at the right coordinates |
| 2.6 | Tap a second pin without dismissing | Card updates to the new partner |
| 2.7 | Back button | Returns to the previous screen |

2.4 is called out because a prior regression navigated every offer to id `0`
(`31f4bff`, FIX 7). Verify the id actually varies.

---

## Gate 3 — performance (the "optimise" half)

Compare against the pre-migration build. Subjective but the whole point.

| # | Step | Expected |
|---|---|---|
| 3.1 | Pan and fling across the map with all pins loaded | Smooth; no visible stutter |
| 3.2 | Pinch-zoom in and out repeatedly | Tracks the gesture without lag |
| 3.3 | Tap a pin, dismiss, tap another, ×10 | No progressive slowdown |
| 3.4 | Rotate the device | Map re-lays out correctly, no stale viewport |
| 3.5 | Background and resume | Map still interactive |

Optional but worth it: run 3.1–3.3 with the RN performance monitor open and
record the JS/UI frame rates before and after. That turns "feels smoother" into
a number for the PR.

---

## Gate 4 — the static preview

Both consumers of `map.component.js`.

| # | Step | Expected |
|---|---|---|
| 4.1 | Open an event detail screen (`eventDetail.screen.js:19`) | Preview renders at the right location |
| 4.2 | Try to scroll/zoom it | Does not move — `interactive={false}` |
| 4.3 | Scroll the parent screen with a finger starting on the map | **Parent scrolls.** The map must not swallow the gesture |
| 4.4 | Open a location view screen (`location-view.screen.js:25`) | Same |
| 4.5 | Rounded top corners intact | Styling preserved |

4.3 is the regression risk in swapping how the preview disables interaction.

---

## Gate 5 — the iOS floor

**Do not skip.** This is the migration's critical risk.

| # | Step | Expected |
|---|---|---|
| 5.1 | Confirm `ios.deploymentTarget` is `"17.0"` in `ios/Podfile.properties.json` | Set |
| 5.2 | Confirm the built app's `MinimumOSVersion` is 17.0 | Set |
| 5.3 | If an iOS 16 device is available, try to install | **Refused by the OS** — not a blank map |

If 5.3 shows a blank map instead of refusing, the deployment target did not take
and the feature is not shippable.

---

## Rollback

Phases B and C are one commit each and revert cleanly. Phase A is independent
and should **not** be reverted with them — those fixes stand on their own
(`plan.md`, "Phased approach").

Native dependency changes need a full rebuild after any revert; an OTA update
cannot undo them.
