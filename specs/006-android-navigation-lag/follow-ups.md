# Findings — Android stack navigation lag

## Status: no code written. That is the correct outcome so far.

`/speckit-implement` was run with no Android device available, and the deciding experiment (T006)
has not been performed. Rather than write plausible-looking changes, here is what was checked and
what it rules in or out.

## Renumbered 005 → 006

`specs/005-static-screen-options/` already existed on branch `005-static-screen-options` (30/39
tasks done, the 9 open ones all device verification). This feature was written as `005` in the same
session the user reported the lag; renamed to `006` to remove the collision.

The two are **complementary, not overlapping**: `005` treats `slideFromRight` purely as an
allocation concern and deliberately preserves `forHorizontalIOS` as behaviour-preserving. Its `R4`
even states no smoothness change is expected. It never asks whether forcing the iOS interpolator on
Android is itself the cost. That question is this feature.

## Corrected before it shipped — F4 / T021

The task list claimed `detachInactiveScreens` was set on only 1 of 6 navigators and should be added
to the other five. **That is wrong.** `@react-navigation/stack` v6.2.1 already defaults it to `true`
on Android:

```js
// node_modules/@react-navigation/stack/lib/commonjs/views/Stack/CardStack.js:317
detachInactiveScreens = Platform.OS === 'web' || Platform.OS === 'android' || Platform.OS === 'ios'
```

Adding it to five navigators would have been five lines of noise claiming an Android win that does
not exist. The explicit prop on `src/screens/homenavigation.js:24` is redundant too. F4 withdrawn,
T021 closed as no-op.

## What still stands

| # | Finding | Confidence |
|---|---|---|
| **F1** | 21 screens use `slideFromRight`, forcing `CardStyleInterpolators.forHorizontalIOS` on Android | Confirmed in `navigation.js` |
| **F2** | `@react-navigation/stack` (JS stack) everywhere; `@react-navigation/native-stack` not installed | Confirmed in `package.json` |
| **F3** | `@react-navigation/native` 6.0.10 on Fabric, siblings drifted (stack 6.2.1, material-top-tabs 6.6.14) | Confirmed |
| **F5** | 4-level nesting: `MainStack → OverlappingStack → Entertainer tabs → HomeStack` | Confirmed |
| **F7** | `gestureResponseDistance: 200` on every `slideFromRight` screen | Confirmed |

## Why F1's fix was not applied blind

Making `slideFromRight` platform-aware is a one-line change, but two things argue against shipping
it unmeasured:

1. **It is only a partial fix.** `@react-navigation/stack` animates in JS on *both* platforms. The
   interpolator determines *what* is animated, not *where*. `forHorizontalIOS` animates translateX +
   overlay opacity + card shadow, and Android shadow rendering is genuinely expensive; the Android
   default animates fewer properties with no shadow. Real saving, but it does not move the
   transition off the JS thread. Only `native-stack` (US2) does that.
2. **It is a visible product change.** Android transitions would look native-Android instead of
   iOS. If the team chose iOS-style slide on both platforms for brand consistency, that is a
   decision to make deliberately, not a side effect of a perf fix.

## The next action, in order

1. **T006, the deciding experiment.** Set `animationEnabled: false` in `slideFromRight` in
   `navigation.js`, rebuild release, and repeat the slow transition.
   - Lag **gone** → the transition animation is the cost → F1/F2 (US1, then US2).
   - Lag **remains** → the destination screen's mount is the cost → US4, and the
     `react-native-maps` `MapView` in `src/components/map/map.component.js` is the first suspect.

   This single toggle routes the whole investigation and takes one rebuild.

2. **T008**, if the lag is recent: the commits on `005-static-screen-options` extended
   `slideFromRight` to more screens. Check whether the lag tracks that change.

3. Only then US1 / US2.

## Closing out 004

S2 (debug build) is eliminated — the lag survives a release build. `specs/004-android-performance/`
should be closed, and its two shipped changes (skeleton visibility gating, `removeClippedSubviews`
on 24 lists) re-measured now that a valid release baseline is possible. Neither has ever been
measured.
