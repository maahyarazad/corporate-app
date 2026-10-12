# Quickstart — validating the Safe Area Context migration

There is **no automated coverage for any of this**. The repo has 27 Jest tests, all pure
logic, and no component or visual-regression harness. Everything below is manual, and the
device checks are the contract tests.

## Prerequisites

- `react-native-safe-area-context@5.6.2` — already installed, no `npm install` needed
- An **Android** device or emulator (required — this is where the behaviour actually changes)
- An **iOS** device or simulator with a notch/Dynamic Island
- A **release** Android build for the final pass. `006` established that debug builds with
  Fabric mislead: `specs/006-android-navigation-lag/tasks.md`

## Static gates — run after every phase

```bash
npm test                    # 27/27
npm run check:styles        # catches the inline style from R6
npm run check:screen-props
npm run check:animation
npm run audit:lists
```

Confirm no deprecated import survives:

```bash
grep -rn "SafeAreaView" src | grep -v "safe-area-context"
# after Phase C this must return nothing but the shared component's own import
```

Confirm exactly one provider:

```bash
grep -rn "SafeAreaProvider" App.js src | grep -v "SafeAreaProviderCompat"
# expect exactly one hit, in App.js
```

## Phase A — provider only

**Expected: no visual change at all.** That is the whole point of shipping it alone.

| # | Check | Pass |
|---|---|---|
| A1 | App boots on both platforms | no blank screen |
| A2 | Cold start, watch the first frame | no jump/shift as insets resolve (R4) |
| A3 | `entertainer.screen.js` still positions correctly | it already used `useSafeAreaInsets` |
| A4 | Toast appears and is not under the status bar | `App.js:87` now has a provider above it |
| A5 | Confirm dialog renders correctly | `App.js:88` |

If A1 fails with a blank screen, check nesting order: `SafeAreaProvider` must be **inside**
`GestureHandlerRootView` and must not break its `flex: 1` (`008`).

## Phase B — the shared component

Exercise the highest-risk call sites first.

| # | Screen | Check |
|---|---|---|
| B1 | `map.screen.js` | **`pointerEvents="box-none"` (R7)** — the map must still pan, zoom and accept marker taps *through* the overlay. If the map is dead to touch, the prop was dropped. |
| B2 | `map.screen.js` | The absolutely-positioned `safeArea2` overlay (back button + my-location button) sits correctly — see the open question in `research.md` |
| B3 | `login.screen.js`, `otpVerification.js` | keyboard open/close does not double-pad the bottom |
| B4 | `noConnection.screen.js` | renders outside the navigator; still padded |
| B5 | Any screen | rotate to landscape and back — insets update, no stale padding |
| B6 | Android | toggle gesture nav ↔ three-button nav in system settings **while the app runs**; layout re-flows |

## Phase C — the ten direct importers

These had **no Android top inset at all** (R3), so this is where new gaps appear.

| # | Screen | Check |
|---|---|---|
| C1 | `home.screen.js` | Android: content no longer under the status bar |
| C2 | `posts.screen.js`, `postDetail.screen.js`, `postSearch.screen.js` | header spacing unchanged on iOS, corrected on Android |
| C3 | `postDetailMarketplace.screen.js` | note it passes an inline `{ backgroundColor: "white" }` — background must still extend under the inset (contract guarantee 4) |
| C4 | `postCard.component.js` | it is a *component*, not a screen — confirm it is not double-wrapped inside a screen that already has a `SafeArea` |
| C5 | `profile.screen.js` | uses **both** patterns (`SafeArea` at `:65`, `SafeAreaView` at `:242`) — check both render paths |

C4 is the one to watch. A nested `SafeArea` inside a `SafeArea` applies the inset twice.

## The R5 decision point

Before Phase C, decide `edges` on a real device:

1. Build Phase B with `edges={["top"]}`. Screenshot 5 representative screens on Android.
2. Rebuild with the default (all edges). Screenshot the same 5.
3. Diff. The bottom delta is the gesture-bar inset.

Ship whichever is chosen **as its own commit**, so review can tell a deprecation swap apart
from a layout change.

## Rollback

Every phase is independently revertable. Phase A is a two-line change to `App.js`; Phase B
is one file. If Android layout regresses and no one is available to triage, revert Phase C
and keep A and B — the deprecation is still resolved for 26 of the 36 files.

## Definition of done

- [ ] `grep -rn "SafeAreaView" src` shows no `react-native` import
- [ ] Exactly one `SafeAreaProvider`, in `App.js`, seeded with `initialWindowMetrics`
- [ ] All five static gates green
- [ ] `no-restricted-imports` extended **by editing the existing entry** — verify with
      `npx eslint src` that an `Animated` import is still flagged (see `contracts/safe-area.md`)
- [ ] B1 confirmed on device — the map is still interactive
- [ ] R5 decision recorded in `follow-ups.md` with the device it was made on
