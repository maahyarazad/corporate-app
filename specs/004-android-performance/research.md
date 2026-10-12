# Phase 0 Research: Android Performance Regression

Resolved against the source tree and the installed packages. Where a question can only be answered
on a device it is marked and assigned to a task rather than guessed.

---

## R1 — What in `002`/`003` could plausibly make Android laggy?

**Decision**: One mechanism is strong enough to lead the investigation: infinite Reanimated
animations that never stop, on components that never unmount.

**Rationale** — three facts that only became a problem together:

1. **`skeleton.js` changed animation engines** (`002`, commit `38f691b`). From
   `Animated.loop(Animated.sequence([...]))` with `useNativeDriver: true` to
   `withRepeat(withSequence(...), -1, false)` with `useAnimatedStyle`.

   The RN native driver serialises the animation to native **once** and runs it with no per-frame
   JS. Reanimated installs a **mapper** on the UI runtime that re-evaluates a worklet **every
   frame**. For one element that is fine; the difference scales linearly with instance count.

2. **`SkeletonLocation` hides rather than unmounts.**
   `src/components/skeletonLocation.js:11` sets `display: display ? "flex" : "none"`. The component
   tree — including **9 `<Skeleton>` children** — stays mounted after loading completes.

3. **`skeleton.js` starts its loop unconditionally.** The effect at `src/components/skeleton.js:26`
   has `[]` dependencies and no visibility check. `cancelAnimation` is only reached on **unmount**,
   which never happens for a `display: none` skeleton.

Net effect: a location screen that has finished loading and looks completely static is still
evaluating **nine worklets per frame, indefinitely**. Under the old native driver those nine were
cheap native nodes; under Reanimated they are nine per-frame JS-in-worklet evaluations on the UI
thread. Every location screen retained in the navigator stack adds nine more.

This also matches the reported *symptom shape*: not a uniform slowdown, but degradation that grows
with use — which reads as a memory leak and is at least partly a **CPU** leak.

**Where this does NOT apply**: `useShakeAnimation` uses `withRepeat(..., 2)` — finite, fires only on
validation failure. Not a suspect.

**Alternatives considered**: That Fabric itself regressed performance — rejected, Fabric was already
enabled before `002` (`android/gradle.properties:38` predates these branches).

---

## R2 — Is the laggy build a debug build?

**Decision**: Rule this out **first**, before touching any code. Assigned to T-01.

**Rationale**: On Android, a debug build with the New Architecture and Reanimated is dramatically
slower than release — worklets run uncompiled, the bridge is instrumented, and dev-mode assertions
fire per render. "Suddenly super laggy on Android" is more often a debug build than a code
regression, and it costs one build to eliminate.

It is also **confounded with S1**: `__DEV__` logging in `pushDestination.js` and
`entertainer.screen.js` runs only in debug, so a debug measurement inflates unrelated costs too.

**Cannot be answered from the repo.** The build variant is not recorded anywhere in source.

**Alternatives considered**: Assuming release and proceeding — rejected; if it is debug, every
subsequent measurement in this plan is noise.

---

## R3 — Did the `FlatList` → `ScrollView` conversions drop `removeClippedSubviews`?

**Decision**: **No.** Hypothesis checked and discarded. Recorded so it is not re-derived.

**Rationale**: Older React Native defaulted `removeClippedSubviews` to `true` for `VirtualizedList`
on Android, and losing that would have been a clean explanation for the two conversions in `003`.
It is not the case here — `node_modules/react-native/node_modules/@react-native/virtualized-lists/`
carries no such Android default in RN 0.81; `removeClippedSubviews` appears only as an untyped
optional prop.

Both converted instances also had **no `data` and no `renderItem`**, so the `VirtualizedList` was
rendering exactly one footer element. There was no virtualization to lose.

**Residual risk (S5, low-medium)**: `location-view.screen.js`'s `renderPartner` mounts a
`react-native-maps` `MapView`, a `Slideshow`, and an `OfferList`. That was true before the
conversion too, but a `MapView` inside a plain `ScrollView` is worth confirming on device — Android
map surfaces are expensive and do not clip themselves.

**Alternatives considered**: Reverting the conversions pre-emptively — rejected; they removed two
real VirtualizedLists that rendered no list, and there is no evidence against them yet.

---

## R4 — Is there an actual memory leak, or is it CPU?

**Decision**: Treat "leak" as unconfirmed. Measure heap growth explicitly (T-03) rather than
inferring it from lag.

**Rationale**: Sustained lag that worsens over a session reads as a leak but is more often
accumulating work. R1 describes exactly that: worklets that accumulate and never stop.

Two genuine unbounded-growth sites exist, both small:

| Site | Assessment |
|---|---|
| `src/screens/entertainer.screen.js:146` — `handledNotificationIds` `Set` | **Real, unbounded.** Notification ids are added and never pruned. Grows only per notification tapped, so it is tiny — but it is a true leak and trivially capped. |
| `src/components/cacheImage.js:107` — `inFlight` `Map` | **Not a leak.** `forget()` at line 137 deletes the entry on settle. Verified. |

Reanimated shared values and mappers are released on unmount — so for `SkeletonLocation`, which
never unmounts, they are never released. That is R1 again, viewed as memory.

**Alternatives considered**: Adding a leak-detection library — rejected; Android Studio's Memory
Profiler answers this without a dependency.

---

## R5 — Which Android measurements actually distinguish the suspects?

**Decision**: Three, in this order — build variant, then UI-thread FPS, then heap over time.

**Rationale**:

| Measurement | Distinguishes | Tool |
|---|---|---|
| Build variant | S2 from everything else | `npx expo run:android --variant release` |
| **UI-thread** frame time, static screen | **S1 and S3** — a static screen burning frames is the signature | Android Studio Profiler; `adb shell dumpsys gfxinfo <pkg>` |
| JS-thread FPS while scrolling | S5, S6 | RN dev menu perf monitor |
| Heap after N screen visits | S4, and confirms leak vs CPU | Android Studio Memory Profiler |

The decisive one is **UI-thread cost on a screen that has finished loading and is not being
touched**. Under S1 that screen is doing nine worklet evaluations per frame; if frame time there is
near zero, S1 is wrong and the plan should move on.

`adb shell dumpsys gfxinfo <package> framestats` gives janky-frame percentages without Android
Studio and is scriptable, so it is the preferred baseline capture.

**Alternatives considered**: Relying on the RN perf monitor alone — rejected; it reports JS FPS
prominently, and S1 is a **UI**-thread cost that JS FPS will not show.

---

## R6 — Which general Android optimizations are actually justified here?

**Decision**: Record them; apply **none** unless Phase D shows the app still misses budget. Phase E
is contingent.

**Rationale**: The user asked to check all available Android optimizations. Applying a checklist is
what produced this regression — `003` shipped 27 list changes with no profiling, and the branch is
now suspected of causing the problem it meant to solve. Findings below are ordered by evidence, and
each names what would justify it.

| Candidate | Status | Justified by |
|---|---|---|
| **Stop animating hidden skeletons** | **Phase C — do this** | R1, mechanism confirmed in code |
| **Cap `handledNotificationIds`** | **Phase C — do this** | R4, real unbounded growth, ~3 lines |
| Verify release build | Phase A | R2 |
| `enableProguardInReleaseBuilds=true` | Contingent | Absent from `android/gradle.properties`. Affects APK size and startup, **not** frame rate — will not fix this lag. Enable deliberately, with its own test pass, not as part of a perf fire |
| Drop `x86`/`x86_64` from `reactNativeArchitectures` for release | Contingent | Currently builds 4 ABIs. Halves APK size; no runtime effect on real devices. Emulators need x86 — do not remove from the dev profile |
| `removeClippedSubviews` on long lists | Contingent | Only after profiling names a specific list. Known blank-cell bugs on Android; `003` deliberately declined it |
| `getItemLayout` on fixed-height rows | Contingent | `003` declined it because no candidate declares a fixed height (`003/follow-ups.md` F7). Unchanged here |
| FlashList for the 3 paginated lists | Contingent | New native dependency + prebuild. Only after profiling proves FlatList is the bottleneck |
| Hermes / New Arch | **Already on** | `hermesEnabled=true`, `newArchEnabled=true` |

**Alternatives considered**: Applying the full list now — rejected. It would make the regression
harder to attribute and repeats the mistake this plan exists to correct.

---

## R7 — What is the fix for S1, and what does it risk?

**Decision**: Stop the animation when the skeleton is not visible. Prefer unmounting; gate the loop
where unmounting is impractical.

**Rationale** — two options, both cheap:

- **Unmount** — change callers from `<SkeletonLocation display={loading} />` to
  `{loading && <SkeletonLocation />}`. Cleanest: React frees the tree, `cancelAnimation` runs on
  unmount, and no `Skeleton` change is needed. **Risk**: `display: none` preserves layout slot
  behaviour that unmounting does not; the screen may shift or flash if anything depended on it.
- **Gate the loop** — pass `display` down and have `skeleton.js` skip or cancel when hidden.
  Preserves the existing DOM shape exactly. **Risk**: none to layout; slightly more code.

Given no device verification is available in-session, **the gating option is the safer default** and
the unmount option is the cleaner endpoint once someone can watch the screen.

Either way the effect's `[]` dependency array should also gain `[opacityMin, opacityMax, display]`,
since it currently closes over props it never re-reads.

**Alternatives considered**: Reverting `skeleton.js` to RN `Animated` — rejected unless the fix
fails to move the number; it would reintroduce a `check:animation` gate violation and lose the
cleanup fix. Kept as the fallback in Phase C.
