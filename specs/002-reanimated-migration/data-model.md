# Phase 1 Design: Migration Inventory

The "entities" of this refactor are the animation call sites. This is the authoritative
per-file worklist. Line numbers are from the survey on 2026-08-27 and will drift as files
are edited — treat them as locators, not addresses.

## Legend

- **Driver** — `native` = `useNativeDriver: true` (already off the JS thread), `JS` = `false`
- **Risk** — likelihood of a visible regression

---

## Class A — Validation shake (5 files)

**Verified byte-identical in all five files.** The pattern is *not* a sequence — it is a single
120ms linear `timing` from `0 → 2`, wrapped in `Animated.loop(..., { iterations: 2 })`, whose
value is interpolated `[0, 0.5, 1, 1.5, 2] → [0, -10, 0, 10, 0]` to produce four half-shakes over
240ms. `shake()` also calls `Vibration.vibrate()` first.

| File | Locator | Driver |
|---|---|---|
| `src/screens/corporate/registration.screen.js` | 112, 124, 134 | native |
| `src/screens/corporate/registrationDetails.screen.js` | 126, 138, 148 | native |
| `src/screens/reset-password/changePassword.js` | 29, 41, 51 | native |
| `src/screens/reset-password/forgotPassword.js` | 36, 48, 58 | native |
| `src/screens/login/updateMember.screen.js` | 51, 63, 73 | native |

**Target**: a single shared hook, `src/hooks/useShakeAnimation.js`:

```
useShakeAnimation() -> { shakeStyle, shake }
```

Internally `useSharedValue(0)`; `shake()` calls `Vibration.vibrate()`, resets the value to `0`,
then assigns `withRepeat(withTiming(2, { duration: 120, easing: Easing.linear }), 2, false)`.
`shakeStyle` is a `useAnimatedStyle` returning
`{ transform: [{ translateX: interpolate(v.value, [0,0.5,1,1.5,2], [0,-10,0,10,0]) }] }`.
Because all five are identical, the hook needs **no options**. Each screen loses ~22 lines.

**Latent fragility being removed**: every screen writes
`.start(animatedShake.setValue(0))`. JS evaluates the argument first, so `setValue(0)` runs
*before* `.start()` — which is what resets the value between shakes. It works, but only by
accident of evaluation order; had it truly been a completion callback the value would stay at `2`
and the second shake would be a no-op. The hook makes the reset explicit.

**Risk**: Low. **Container element must switch to `Animated.View` from `react-native-reanimated`.**

---

## Class B — Success entrance sequence (2 files)

| File | Locator | Driver |
|---|---|---|
| `src/screens/corporate/registrationSuccess.screen.js` | 3, 12–14, 29/37/44 | native |
| `src/screens/corporate/registrationSuccessByServices.screen.js` | 3, 14–16, 33/41/48 | native |

Three values each — `bounceValue`, `fadeInValue`, `fadeInButton` — staggered on mount:
- `bounceValue`: `Animated.spring({ toValue: 1, delay: 1000, mass: 1 })`, interpolated
  `[0,1] → [-100,0]` for `translateY`, and used directly as `opacity`
- `fadeInValue`: `timing(1, { duration: 800, delay: 1000 })`
- `fadeInButton`: `timing(1, { duration: 700, delay: 1500 })`, interpolated `[0,1] → [0.9,1]`

**Target**: three shared values assigned in a mount effect —
`withDelay(1000, withSpring(1, { mass: 1 }))`, `withDelay(1000, withTiming(1, { duration: 800 }))`,
`withDelay(1500, withTiming(1, { duration: 700 }))`. Reanimated's `withSpring`/`withTiming` have
no `delay` option, so `withDelay` is mandatory here.

**Note**: `Easing` is imported from `react-native` in both files but appears unused — confirm and
drop the import rather than carrying it over.

**Note**: the two files are near-identical. Do **not** merge them in this refactor; that is a
separate deduplication decision. Convert both, leave the duplication, flag it.

**Risk**: Low.

---

## Class C — Looping shimmer (2 files)

| File | Locator | Driver |
|---|---|---|
| `src/components/skeleton.js` | 2, 14, 17, 21/28 | native |
| `src/components/cacheImage.js` | 9, 34, 38, 42 | native |

The two differ and must not be converted with the same shape:

- `skeleton.js` — `loop(sequence([ timing(opacityMax, {duration:300, delay:200, linear}),
  timing(opacityMin, {duration:700, linear}) ]))`. Target:
  `withRepeat(withSequence(withDelay(200, withTiming(max, {duration:300, easing:linear})),
  withTiming(min, {duration:700, easing:linear})), -1, false)` — `reverse` must be **false**,
  the sequence already returns to the start.
- `cacheImage.js` — `loop(timing(1, {duration:1200}))`, a one-way 0→1 sweep driving a
  `translateX` shimmer. Target: reset to `0`, then
  `withRepeat(withTiming(1, {duration:1200}), -1, false)`.

**Critical**: `cacheImage.js` stops its loop on unmount (`return () => loop.stop()`).
`withRepeat` has no handle — **cancel with `cancelAnimation(sharedValue)` in the effect cleanup**,
or the loop keeps running against an unmounted component. Both components render inside lists, so
leaking loops here is a real performance cost, not a theoretical one. Check whether `skeleton.js`
currently cleans up; if it does not, that is a pre-existing leak to fix in passing.

**Risk**: Low, conditional on the cleanup above.

---

## Class D — Mount fade-in (2 files)

| File | Locator | Driver |
|---|---|---|
| `src/screens/offer/transactionSummary.screen.js` | 5, 13–15, 37/43/48 | native |
| `src/components/postCardUpload.js` | 3, 12, 17, 20 | native |

`transactionSummary` has three staggered opacities (`0`, `0`, `0.6` initial).
`postCardUpload` has one, and stores the animation in a local `animation` variable —
check whether it is stopped on unmount and preserve that behaviour with `cancelAnimation`.

**Risk**: Low.

---

## Class E — Press scale (1 file)

`src/components/animatedButton.js` — locators 4, 22, 32, 40, 44, 52.

`buttonScale` drives both a `transform: scale` and, via `interpolate`, an `opacity`.
Uses `Animated.spring({ speed })` — see `research.md` R5 for the parameter mapping.

**Defect to fix while converting** — see §Defects D1.

**Risk**: Low, but the component is used in at least `requestapproval.screen.js`; grep for all
`AnimatedButton` consumers and smoke-test each.

---

## Class F — Scroll-driven header (1 file)

`src/screens/location/location-view.screen.js` — locators 304, 306–310, 388–391.

`Animated.FlatList` with `onScroll={Animated.event([{nativeEvent:{contentOffset:{y}}}], {useNativeDriver:true})}`,
feeding an `interpolate([100,270] → [-200,0], clamp)` that slides a sticky header in.

**Target**:
- `useAnimatedScrollHandler(({ contentOffset }) => { scrollY.value = contentOffset.y })`
- `Animated.FlatList` imported from `react-native-reanimated`
- header style via `useAnimatedStyle` + `interpolate(..., Extrapolation.CLAMP)`
- keep `scrollEventThrottle={16}` (harmless; the handler runs natively regardless)

**Defect to fix while converting** — see §Defects D2.

**Risk**: Medium. The header is `position: absolute, zIndex: 999` over the list; verify it still
sits above the list and that `RefreshControl` pull-to-refresh still works with the Reanimated
`Animated.FlatList`.

---

## Class G — JS-driven layout and colour (4 files) — HIGHEST RISK

These currently run on the JS thread. Converting them is the substantive win of this migration
and the place regressions will appear.

### G1 `src/components/customTextInput.js` (locators 9, 92, 94–105, 117, 126)

Floating-label input. One value `0→100` feeds three interpolations: `scale` (1→0.8),
`translateX` (0 → `label.length * -1`), `translateY` (0 → -22).

Complications:
- Wrapped in `forwardRef` + `useImperativeHandle` (exposes `focus`, `clear`, `getNativeInput`) —
  the ref contract must not change.
- `useLayoutEffect` on `value` calls `floatUp()`.
- **Defect D3**: `.start(setFocused(true))` — see §Defects.
- `outputRange` depends on the `label` prop, so the interpolation must read `label` inside the
  worklet's dependency set (`useAnimatedStyle` captures it; confirm it re-creates when `label` changes).

**Target**: shared value + `useAnimatedStyle` with three `interpolate` calls. This is the most
used component in the list — every form in the app renders it.

### G2 `src/components/offerList.js` (locators 40, 45, 53)

Animates container **height** between `OFFER_COMPONENT_HEIGHT * minItems` and
`OFFER_COMPONENT_HEIGHT * offers.length`. `collapse()` calls `setShowAll(!showAll)` in the
completion callback → **must be `runOnJS(setShowAll)(...)`**.

**Target**: `useSharedValue(initialHeight)` + `useAnimatedStyle(() => ({ height: h.value }))`,
`withTiming(..., { duration: 300 }, (finished) => { if (finished) runOnJS(setShowAll)(!showAll) })`.

Note `initialHeight` is derived from `offers.length` on every render but `useSharedValue` only
takes its initial argument once — if `offers` can change after mount, add an effect to resync.

### G3 `src/screens/login/requestapproval.screen.js` (locators 55, 145, 154, 233)

`cameraContainerAnimated` height, two `Animated.spring({ speed: 40 })` calls;
`closeCamera` has `delay: 200` and a completion callback calling `setIsCameraOpen(false)` →
**`runOnJS` required**. `withSpring` has no `delay` option — wrap in `withDelay(200, withSpring(...))`.

### G4 `src/features/profile/profRedeemHistory.js` (locators 141, 149, 157)

Breakdown panel height, seeded from `viewHeight` state set by `onLayout`.
Declared `useNativeDriver: true` **while animating height**, which the native driver does not
support — see §Defects D4. Converting to Reanimated removes the contradiction, but means the
animation may start working where it previously did nothing. **Confirm the intended behaviour
with the product owner before assuming the new behaviour is correct.**

`useSharedValue(viewHeight)` captures `0` at mount (state initialises to `0`); an effect must
push `viewHeight` into the shared value once `onLayout` fires.

Both `showBreakdown` and `hideBreakdown` call `.start(setDisplayBreakdown(!displayBreakdown))` —
same defect class as D3.

---

## Class H — Dead code (2 files)

| File | Finding | Action |
|---|---|---|
| `src/screens/login/otpVerification.js:7` | `import { sub } from "react-native-reanimated"` — `sub` is a Reanimated **v1** API, removed in v2+. It resolves to `undefined` and is never used (the `sub*` matches elsewhere in the file are `subInterval`, unrelated). | Delete the import |
| `src/features/locations/components/headerImage.component.js` | Entire component is `return <Animated.Image></Animated.Image>` — an empty stub | Confirm no importers, then delete the file; if imported, convert the import and leave the stub |

---

## Already on Reanimated (verify only, do not rewrite)

| File | Note |
|---|---|
| `src/components/slideshowV2.component.js` | Uses `Extrapolate` → rename to `Extrapolation` (R1) |
| `src/components/hotpick/hotpicks.component.js` | Same `Extrapolate` rename; also has a bare `import "react-native-reanimated"` on line 17 that is redundant with the named import two lines later — remove |
| `src/screens/posts/postDetailMarketplace.screen.js` | `react-native-reanimated-carousel` consumer, no change |

---

## Defects found during survey

Fix these **as part of** the conversion of the owning file, and call them out in the commit
message so they are not mistaken for refactor noise.

**D1 — `animatedButton.js:22`: animated value recreated every render.**
`const buttonScale = new Animated.Value(1);` is not in a `useRef`/`useMemo`, so every re-render
discards the in-flight animation and resets the scale. `useSharedValue(1)` fixes this inherently.

**D2 — `location-view.screen.js:320-324`: dead effect comparing an object to a number.**
```js
useEffect(() => { if (animatedValue > 2) { /* commented out */ } }, [animatedValue]);
```
`animatedValue` is an `Animated.Value` instance, never `> 2`, and the body is commented out.
The dependency is a stable ref so the effect never re-runs. Delete it.

**D3 — `.start(setState(...))` invoked immediately, not as a callback.**
`Animated.timing(...).start(setFocused(true))` calls `setFocused(true)` *during render setup* and
passes its return value (`undefined`) as the completion callback. The state change therefore
happens at animation **start**, not **end**. Sites: `customTextInput.js:118,127`,
`profRedeemHistory.js:152,160`, `offerList.js` (`.start(() => {...})` — correct there).

This is a **behaviour change if fixed**. Two options per site: preserve today's behaviour (set
state immediately, before starting the animation) or fix it (`runOnJS` in the completion
callback). **Default to preserving current behaviour** — this refactor should not silently change
UX — and log each site for a follow-up decision.

**D4 — `profRedeemHistory.js:149,157`: `useNativeDriver: true` on a height animation.**
The native driver supports only `opacity` and `transform`. Animating height under it is a no-op
or a warning, so the panel likely does not animate today. See G4.

---

## New files created by this migration

| Path | Purpose |
|---|---|
| `src/hooks/useShakeAnimation.js` | Shared shake used by the five Class-A screens |
| `.eslintrc` rule additions (existing config) | Ban `Animated` from `react-native` and all `InteractionManager` usage |
