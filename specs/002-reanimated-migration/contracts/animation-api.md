# Contract: Internal Animation API

This app exposes no external API. The contracts that matter here are **internal**: the
component props and hook signatures that other code depends on. The migration must hold every
one of them constant.

## C1 — Public component props (MUST NOT change)

Converting a component's internals must not change its prop surface. Callers are not part of
this refactor.

### `AnimatedButton` — `src/components/animatedButton.js`

Single consumer: `src/screens/login/requestapproval.screen.js:604`.

| Prop | Contract after migration |
|---|---|
| `speed` (default `200`) | **Name and default preserved.** Reanimated has no `speed`; map it internally to `withSpring` `damping`/`stiffness` (research R5). The prop must keep behaving as "higher = faster". |
| `scaleTo` (default `0.9`) | Unchanged — becomes the `withSpring` target and the `interpolate` input lower bound |
| `onPress`, `label`, `styles`, `textSize`, `textWeight`, `textColor`, `buttonColorTo`, `buttonColorFrom`, `iconName`, `iconSize`, `disabled`, `checked` | Unchanged, untouched |

### `CustomTextInput` — `src/components/customTextInput.js`

The imperative handle is a hard contract. After migration `useImperativeHandle` MUST still expose:

```
{ focus(), clear(), getNativeInput() }
```

`label` and `value` continue to drive the float animation with identical geometry:
`scale 1→0.8`, `translateX 0→(label.length * -1)`, `translateY 0→-22`, 200ms.

### `OfferList` — `src/components/offerList.js`

`offers`, `minItems` props unchanged. Collapsed height stays
`OFFER_COMPONENT_HEIGHT * minItems`; expanded stays `OFFER_COMPONENT_HEIGHT * offers.length`;
duration stays 300ms. The `showAll` state must still flip **after** the collapse completes.

### `Skeleton` / `CacheImage`

`opacityMin` and any timing props unchanged. The shimmer must remain visually continuous —
same period, same opacity endpoints.

## C2 — New internal hook (new contract)

### `useShakeAnimation` — `src/hooks/useShakeAnimation.js`

```
useShakeAnimation(options?) -> { shakeStyle, shake }
```

| Member | Type | Meaning |
|---|---|---|
| `shakeStyle` | animated style object | Spread onto a `react-native-reanimated` `Animated.View`. Produces `transform: [{ translateX }]`. |
| `shake` | `() => void` | Callable from JS-thread event handlers (validation failure). Idempotent — calling mid-shake restarts cleanly. |
| `options.offset` | `number` | Optional. Peak displacement. Default = the value currently used by the five Class-A screens. |
| `options.duration` | `number` | Optional. Per-step duration. Default = current value. |

**Precondition**: before writing the hook, read all five Class-A screens and confirm their
sequences are byte-identical. If any differs, that screen passes `options` rather than having its
behaviour silently normalised.

## C3 — Thread-boundary contract (the rule that prevents most bugs)

`Animated.*.start(cb)` runs `cb` on the JS thread. The `withTiming`/`withSpring` completion
callback runs on the **UI thread**. Therefore:

> Any React state setter, navigation call, or non-worklet function invoked from a Reanimated
> completion callback MUST be wrapped in `runOnJS(...)`.

Call sites where this applies (omitting `runOnJS` fails **silently** in release builds):

| File | Callback does |
|---|---|
| `src/components/offerList.js` | `setShowAll(!showAll)` |
| `src/screens/login/requestapproval.screen.js` | `setIsCameraOpen(false)` |
| `src/components/customTextInput.js` | `setFocused(...)` — but see defect D3 |
| `src/features/profile/profRedeemHistory.js` | `setDisplayBreakdown(...)` — see defect D3 |

Completion callbacks also receive a `finished: boolean`. Guard state changes with it so an
interrupted animation does not commit a state transition that never visually happened.

## C4 — Import contract

After migration, this grep MUST return zero results across `src/`, `App.js`, and `navigation.js`:

```bash
grep -rnE "Animated\.(Value|ValueXY|timing|spring|decay|sequence|parallel|stagger|loop|delay|event|createAnimatedComponent)" \
  --include="*.js" --include="*.jsx" src App.js navigation.js
grep -rn "InteractionManager" --include="*.js" --include="*.jsx" src App.js navigation.js
```

The gate targets the **legacy API surface**, not the import statement: 9 of the 18 files import
`Animated` inside a multi-line `import { … } from "react-native"` that a single-line import regex
does not catch. `Animated.Value`/`.timing`/`.spring`/`.loop`/`.event` exist only on React
Native's API and never on Reanimated's, so they are the reliable signal.

Enforced by `npm run check:animation` (T-05a). Baseline today: 61 matching lines in 17 files for
the first grep, 0 for the second.

`Easing` may be imported from either `react-native` or `react-native-reanimated`, but a file
using Reanimated animations MUST take `Easing` from `react-native-reanimated` so the easing
function is worklet-serialisable.

## C5 — Deprecated-name contract

`Extrapolate` is the Reanimated 3 spelling. All code MUST use `Extrapolation`. Currently
violated in `src/components/slideshowV2.component.js` and
`src/components/hotpick/hotpicks.component.js`.
