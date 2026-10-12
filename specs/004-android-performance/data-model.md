# Phase 1 Design: Suspect Inventory

The "entities" here are the suspected causes. Each carries the evidence found, what would confirm or
kill it, and the fix if confirmed. Locators are from 2026-08-27 on `003-flatlist-optimization`.

**Rule for this table**: a suspect is only promoted to a fix once a measurement names it. The
mechanism for S1 is strong, but "strong mechanism, no measurement" is precisely what shipped the
regression.

---

## S1 — Skeleton worklets that never stop

**Confidence: High.** Mechanism confirmed in code; effect size unmeasured.

| | |
|---|---|
| Origin | `002`, commit `38f691b` |
| Files | `src/components/skeleton.js:26-48`, `src/components/skeletonLocation.js:11` |
| Symptom fit | Degrades with use; UI thread, not JS thread; worst on screens visited repeatedly |

**Evidence chain:**

1. `skeleton.js:26` starts `withRepeat(..., -1, false)` in a mount effect with `[]` deps and no
   visibility check.
2. `cancelAnimation(opacity)` is in the effect's cleanup, so it runs **only on unmount**.
3. `skeletonLocation.js:11` hides via `display: display ? "flex" : "none"` — the subtree **never
   unmounts**, so cleanup never runs.
4. `SkeletonLocation` contains **9** `<Skeleton>` children.
5. Reanimated re-evaluates a `useAnimatedStyle` worklet **per frame**; the RN native driver it
   replaced did not.

**Result**: a finished, static location screen evaluates 9 worklets per frame indefinitely. Each
additional location screen left mounted adds 9.

**Confirm with**: UI-thread frame time on a fully-loaded location screen with **no interaction**
(`quickstart.md` M3). Near-zero cost kills this suspect outright.

**Fix** (`research.md` R7): gate the loop on visibility, or unmount the skeleton. Also add
`[opacityMin, opacityMax]` to the effect's dependency array — it closes over props it never re-reads.

**Fallback**: revert `skeleton.js` to the RN `Animated` implementation. Costs a `check:animation`
gate exemption; acceptable if the gated fix does not move the number.

---

## S2 — Debug build

**Confidence: High prior, untested.** Cannot be determined from the repo.

A debug Android build with Fabric + Reanimated is dramatically slower than release: uncompiled
worklets, instrumented bridge, dev-mode assertions, and the `__DEV__` logging in
`pushDestination.js` and `entertainer.screen.js:161`.

**Confirm with**: rebuild as release and repeat the same scenario (`quickstart.md` M1). **This is
task one.** If the lag disappears, everything below is moot and the plan stops.

---

## S3 — CacheImage shimmer

**Confidence: Medium.** Same engine change as S1, different exposure profile.

| | |
|---|---|
| Origin | `002`, commit `38f691b` |
| File | `src/components/cacheImage.js:44-58` |

`withRepeat(withTiming(1, 1200ms), -1, false)` plus a `useAnimatedStyle` that interpolates against
`containerWidth`. One instance **per list row**, so a scrolled list can hold many concurrently.

Unlike S1 it **does** unmount correctly — `cancelAnimation(shimmer)` is reached when the row leaves
the tree. The exposure is therefore bounded by visible rows, not unbounded like S1.

**Confirm with**: UI-thread frame time while scrolling an image-heavy list, and whether it recovers
when scrolling stops (`quickstart.md` M4).

**Fix if confirmed**: stop the shimmer once the image has loaded — currently it keeps running behind
a loaded image in some paths. Cheaper than reverting the engine.

---

## S4 — `handledNotificationIds` grows unbounded

**Confidence: Low as a lag cause. Certain as a leak.**

`src/screens/entertainer.screen.js:146` — a `Set` of notification ids that is added to and never
pruned. Genuinely unbounded, but grows only once per notification **tapped**, so realistically
dozens of short strings per session.

**Fix regardless of measurement** — it is ~3 lines and removes a true leak from the report:
cap the set (keep the most recent N ids) or clear it on a timer. Do not let it muddy the S1 signal.

Not to be confused with `cacheImage.js:107`'s `inFlight` Map, which **is** pruned — `forget()` at
line 137 deletes on settle. Verified, not a leak.

---

## S5 — Heavy content eagerly mounted in the converted ScrollView

**Confidence: Low-Medium.**

| | |
|---|---|
| Origin | `003`, commit `01910b4` |
| File | `src/screens/location/location-view.screen.js:395` |

`renderPartner` mounts a `react-native-maps` `MapView` (`src/components/map/map.component.js:3`), a
`Slideshow`, and an `OfferList`. Android map surfaces are expensive and do not clip themselves.

**Important**: this was equally true before the conversion. The old `Animated.FlatList` had **no
`data`**, so it rendered exactly the same single footer — there was no virtualization to lose, and
RN 0.81 no longer defaults `removeClippedSubviews` on Android (`research.md` R3). So the conversion
most likely changed nothing here.

**Confirm with**: bisect (`quickstart.md` M2). Only if `01910b4` is named does this become real.

---

## S6 — `toppartners` memo churn

**Confidence: Low.**

`src/features/home/components/toppartners.component.js` — `groupLabels` (`useMemo`) and
`renderGroup` (`useCallback`) both depend on `topPartnersData`. If the context recreates that object
identity on every render, both memos miss every time and `MemoizedLocationCard` never helps.

**Confirm with**: React DevTools profiler on the home screen — do the location cards re-render on
unrelated state changes?

**Fix if confirmed**: memoize `topPartnersData` at its source in the context, not at the consumer.

---

## S7 — Missing Proguard/R8

**Confidence: Not a lag cause.** Recorded so it is not mistaken for one.

`enableProguardInReleaseBuilds` is absent from `android/gradle.properties`, and
`reactNativeArchitectures` builds all four ABIs. Both affect **APK size and cold start**, not frame
rate. Neither will fix this report.

Worth doing eventually, with its own test pass — R8 can strip code that reflection-based libraries
need, so it is not a change to make during a performance fire.

---

## Fix summary

| Suspect | Action | Gated on measurement? |
|---|---|---|
| S2 | Rebuild as release | **Do first** |
| S1 | Gate skeleton loop on visibility | Confirm with M3 |
| S4 | Cap the notification id set | **No — fix regardless** |
| S3 | Stop shimmer once loaded | Confirm with M4 |
| S5 | Revert `01910b4` | Only if bisect names it |
| S6 | Memoize at the context | Confirm with profiler |
| S7 | Defer | Not this branch |
