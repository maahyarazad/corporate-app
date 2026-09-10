# Phase 0 Research: Disposing Profile and Map when returning to Main

**Feature**: `012-dispose-profile-and` | **Date**: 2026-09-10

Every finding below was verified against the working tree or the installed packages at the paths
named. Nothing here is inferred from library documentation alone — this repo runs
`@react-navigation/native@7.3.18` with `native-stack@7.18.10` and `react-native-screens@~4.16.0`,
and v7's navigation semantics changed enough between minors that the shipped source is the only
authority worth citing.

---

## R1 — `navigate()` to a route already in the stack **pops**, it does not push

**Decision**: treat the two documented return paths as already correct, and do not "fix" them.

`@react-navigation/routers/lib/commonjs/StackRouter.js:224-289`, the `NAVIGATE` case:

1. It searches backwards for a route with the target name (`for (let i = state.routes.length - 1; i >= 0; i--)`).
2. On a hit it returns
   `routes: [...state.routes.slice(0, index), <target route with merged params>]`.

`slice(0, index)` is a truncation. Every route above the target is dropped from the state, React
unmounts those screens, and their state is destroyed.

**Consequences, both verified in the working tree:**

- `src/screens/profile/profile.screen.js:43` —
  `navigate("Main", { screen: "Entertainer", params: { screen: "Home" } })`. `Main` sits at index 0
  of `MainScreen`, so this truncates to `[Main]` and unmounts `Profile`. It works today.
- `src/screens/map.screen.js:296-297` — `navigation.goBack()`, which the router turns into
  `POP` with `count: 1` (`StackRouter.js:291-302`). From `[Main, Map]` that leaves `[Main]` and
  unmounts `Map`. It works today.

**Rationale for calling this out first**: the feature request says these screens "should be
dispose", which reads as a bug report. Half of it is not one. Writing tasks to make `goHome` unmount
Profile would ship a no-op and consume the budget that R3 actually needs.

**Alternatives considered**: none — this is a fact about installed source, not a choice.

---

## R2 — Freezing is off app-wide, and native-stack v7 gives no per-screen switch

**Decision**: the only available lever is the global `enableFreeze()`; there is no screen option to
reach for.

- `grep -rn "enableFreeze\|enableScreens"` across the whole repository returns **zero** hits outside
  `node_modules/`. Nothing in `App.js`, `index.js`, `navigation.js`, `src/` or `hooks/` calls it.
- `react-native-screens/lib/commonjs/components/Screen.js:39` —
  `freezeOnBlur = freezeEnabled()`. `freezeEnabled()` (`core.js:34`) returns the module flag that
  `enableFreeze()` (`core.js:25`) sets, and it is `false` until called.
- `Screen.js:116` — `const freeze = freezeOnBlur && (shouldFreeze !== undefined ? shouldFreeze : activityState === 0)`,
  handed to `DelayedFreeze` (`Screen.js:117`), which is the `react-freeze@1.0.4` wrapper.
- `grep -rn "freezeOnBlur" node_modules/@react-navigation/native-stack/lib/` returns **zero** hits,
  including under `lib/typescript/`. native-stack at this version never forwards a `freezeOnBlur`
  screen option to `ScreenStackItem`.

So today every mounted-but-blurred screen in `MainScreen` re-renders whenever a context above it
writes. `LocationContext` (`src/services/location/location.context.js`) writes on `userLocation`,
`currentMerchant`, `eventList` and `getEventsList` changes — four independent triggers, each of
which re-renders `Map` and `Entertainer` while the user is somewhere else entirely.

**What `enableFreeze()` does and does not do** — this bounds the risk of US3:

`react-freeze` suspends *rendering* of the subtree. It does **not** unmount it, does not clean up
effects, and does not clear timers or subscriptions. A frozen screen's `useEffect` cleanup does not
run and its refs stay valid. That is why freezing is a complement to R4's unmount, not a substitute:
it stops the CPU cost, and leaves the native view exactly where it was.

**Alternatives considered**:

- *A per-screen `freezeOnBlur` option* — rejected: does not exist at this version (verified above).
- *Passing `shouldFreeze` down manually* — rejected: `ScreenStackItem` accepts it
  (`ScreenStackItem.js:24,78,90`), but native-stack owns that element and gives callers no way to
  reach it without patching the library. This repo does run `patch-package`, so it is possible; it
  is not proportionate to the gain.

---

## R3 — The paths where a screen genuinely is left mounted

**Decision**: this is the real defect surface, and it has two distinct shapes.

### R3a — A screen covered by a push

`src/screens/map.screen.js:223` — `navigation.navigate("Location View", { locId })`. `Location View`
is not in the stack, so R1's "not found" branch runs and it is **pushed**. `Map` stays mounted
underneath.

From there the user can continue deeper without ever popping. Chain traced through the working tree:

| From | Pushes | Site |
|---|---|---|
| `Map` | `Location View` | `map.screen.js:223` |
| `Location View` → `OfferList` → `OfferModalInfo` | `AvailOffer` | `src/features/offers/components/offerModalForm.js:67` |

(`location-view.screen.js:31` imports `OfferList`; `src/components/offerList.js:16,117` renders
`OfferModalInfo`.) The last hop, `AvailOffer` → `TransactionSummary`, is a `reset` rather than a
push — see R8, which changes the picture materially.

So `Map` — the one screen in this navigator holding a native map surface — sits mounted behind
`Location View` and `AvailOffer` for an unbounded time. Nothing releases it before the user pops
back.

**And `Location View` mounts a second map on top of it.** `location-view.screen.js:25` imports
`Map` from `src/components/map/map.component.js`, the static location preview, which renders the
same `PlatformMap` wrapper (`map.component.js:3,33`). So the Map → Location View transition does not
swap one native map view for another: it holds **two live map surfaces at once**, the 100-marker
interactive one underneath and the single-marker preview on top. `eventDetail.screen.js` is the
other consumer of that preview.

This is the single strongest argument for US2, and it was not visible from the feature request.

The covered-screen shape applies to `Profile` via `ProfTabs` too, though `Profile` holds no native
view.

### R3b — Two sibling screens stacked on each other

`navigate("Map")` and `navigate("Profile")` are reachable from places that do not know what is
already on the stack:

- `src/utils/urlRouter.js:19` — a `gecmobile://map` deep link calls `navigate("Map")`
  unconditionally, from a listener mounted app-wide.
- `src/features/home/components/header.component.js:71-73` — `navigate("Profile")`.
- `src/screens/entertainer.screen.js:471-472` — `openMap` / `openProfile`.

Because R1 only pops when the target is *already* in the stack, a deep link to `Map` fired while the
user is on `Profile` produces `[Main, Profile, Map]`. `Profile` is then mounted, unfocused,
unfrozen and unreachable except by popping `Map` — and if the user then returns home via
`navigate("Main")`, both are correctly dropped. But for the whole intervening session, `Profile` is
a live subtree nobody can see.

**Alternatives considered**:

- *Make `Map` and `Profile` mutually exclusive by config* — rejected: React Navigation has no such
  primitive for a stack, and simulating it with `getId` changes the identity semantics of every
  other route.
- *Route both through `popTo`* — partially adopted; see R5.

---

## R4 — What `Map` actually holds, and how to release it

**Decision**: gate the `PlatformMap` element on focus, so an unfocused `Map` renders no map at all.

`src/screens/map.screen.js` mounts exactly one heavy thing:

```
<PlatformMap ... />        // map.screen.js, inside the `partnerLocations && myLocation` branch
```

which resolves to `AppleMaps.View` or `GoogleMaps.View`
(`src/components/map/platformMap.component.js`) carrying `validMarkers` — up to
`PARTNER_COORDINATES_COUNT = 100` records (`map.screen.js:38`) serialised across the bridge in one
array.

The screen already has the two properties that make unmounting it safe and cheap:

1. **The camera is uncontrolled after mount.** `initialCamera` "seeds the opening frame only.
   Deliberately not kept in sync with `myLocation` afterwards" (`map.screen.js`, comment above
   `initialCamera`). A remount therefore reseeds correctly rather than fighting a controlled value.
   The user's pan/zoom is lost — which is exactly the state loss the feature request accepts.
2. **The data comes back from disk.** `getCoordinates` reads
   `PARTNER_COORDINATES_ENDPOINT` from SQLite first under a one-hour TTL (`map.screen.js`,
   `PARTNER_CACHE_TTL_MS`), so a remount inside the TTL touches no network. This is `011` paying
   for `012`.

`useIsFocused` from `@react-navigation/native` is the mechanism. It is already a dependency and is
already used elsewhere in the repo's idiom via `useNavigation`.

**Where the gate goes**: on the `PlatformMap` element only, not on the whole screen. Returning
`null` for the entire screen would tear down the `SafeArea` overlay and the partner card too, and —
more importantly — would run the hook-order risk that `map.screen.js`'s own "FIX 10" comment at the
bottom of the file documents in detail. Gating one element inside the existing
`partnerLocations && myLocation` conditional adds no hook and no new early return.

**Alternatives considered**:

- *Unmount the whole `Map` screen on blur* — rejected: native-stack has no `unmountOnBlur`
  (that option belongs to bottom-tabs, and v7 renamed it `popToTopOnBlur` there anyway), so this
  would have to be simulated with a full-screen `null` return, with the hook-order hazard above.
- *Set `markers={[]}` while blurred* — rejected: it keeps the native map surface alive, which is the
  expensive part, and costs a full marker re-serialisation on return.
- *Rely on `enableFreeze()` alone* — rejected: R2 establishes that freezing suspends rendering and
  leaves the native view mounted. It does not release the map.

---

## R5 — How to make the return to `Main` unconditional

**Decision**: one `returnToMain()` helper in `src/navigation/navigate.js`, built on
`CommonActions.reset`.

`src/navigation/navigate.js` today exports `navigate` and `goback` over a
`createNavigationContainerRef()`. It is already the single module every non-screen call site imports
for navigation, which makes it the right home.

The helper must satisfy FR-001 (exactly one route) and FR-003 (select a tab inside `Main` in the
same operation). Three candidate mechanisms:

| Mechanism | Meets FR-001? | Meets FR-003? |
|---|---|---|
| `navigate("Main", { screen, params })` | Only if `Main` is already in the stack | Yes |
| `StackActions.popToTop()` | Only if `Main` is already at index 0 | No — cannot address the nested tab |
| `CommonActions.reset({ index: 0, routes: [{ name: "Main", params }] })` | Yes, by construction | Yes — nested params ride along |

`reset` is the only one that is correct by construction rather than by assumption. It states the
desired stack rather than deriving it, so it holds whatever the prior stack was — including the
R3b case where `Main` is at index 0 but two siblings sit above it, and the R8 case where `Main` is
**not in the stack at all**. That last case is not hypothetical, which is what rules the other two
mechanisms out rather than merely ranking them below `reset`.

`reset` is also already this repo's idiom for exactly this kind of move — see R8.

The nested params keep `goHome`'s existing shape:

```
{ name: "Main", params: { screen: "Entertainer", params: { screen: "Home" } } }
```

**On testability**: `reset` produces a plain action object, so the helper can be unit-tested by
mocking `navigationRef` and asserting on `dispatch`'s argument. That is what makes US1 testable
without a device, and it is the one part of this feature `jest-expo` can genuinely cover.

**Alternatives considered**:

- *`popToTop()` then `navigate()`* — rejected: two dispatches, two renders, and a window between
  them where the tab is still whatever it was.
- *`navigate` with `getId`* — rejected: `getId` changes route identity for every navigation to that
  route, not just this one.

---

## R6 — The repo gates conventions statically, and this convention needs one

**Decision**: add `scripts/check-main-stack-return.js` and an npm script, matching the five that
exist.

`package.json` already ships: `check:animation`, `audit:lists`, `check:styles`,
`check:screen-props`, `check:cache-coverage`. `scripts/check-screen-props.js` is the closest model —
it parses `navigation.js` with `@babel/core` to enumerate registered screens, then fails the build
on a banned call shape.

The rule this feature needs is the same shape: **no file under `src/` may call `navigate("Main", …)`
or `navigation.navigate("Main", …)` directly** — the return goes through `returnToMain()`. Without
it, US1's guarantee survives exactly until the next contributor adds a home button.

`navigate("Main")` appears once today (`profile.screen.js:43`), and that call site is the one this
feature replaces, so the gate starts green.

**Alternatives considered**:

- *An ESLint rule* — rejected as the first move: `lint` only covers `src` (`"lint": "eslint src"`),
  which is right, but a `no-restricted-syntax` selector for this is less readable than the node
  script and inconsistent with how the other five conventions are enforced here.
- *No gate* — rejected: see US4.

---

## R7 — Interaction with in-flight work at disposal time

**Decision**: nothing new is required; the existing cancellation discipline already covers it.

Unmounting `Map` runs its `useEffect` cleanup (`map.screen.js`), which sets `cancelled = true` and
calls `controller.abort()`. The catch re-checks `isCancel(error)` (`src/utils/cancellation.js`) and
returns silently. `getCoordinates` additionally re-checks `controller.signal.aborted` after the
SQLite read, because that read is not abortable.

`Profile`'s `getPartnerTitle` (`profile.screen.js`) has no abort controller — it `console.log`s on
failure and its `setPartnerTitle` after unmount is a no-op under React 19, not a warning. Adding a
controller there is a reasonable tidy-up but is not required by any FR, and is listed as such.

**Rationale**: FR-009 is satisfied by code that already exists. Claiming it as new work would be
padding.

---

## R8 — `reset` is already used here, and it currently disposes `Main` itself

**Decision**: adopt `reset` for `returnToMain()` on the strength of this precedent, and record the
existing behaviour it reveals without changing it.

Two call sites already do exactly the operation R5 proposes:

- `src/screens/offer/availOffer.screen.js:168-170` —
  `navigation.reset({ routes: [{ name: "TransactionSummary", params: result?.data }] })`
- `src/features/offers/components/offerRedeemForm.js:111-113` — the same call with `consumed.data`.

So `reset` is not a new mechanism being introduced to this codebase; it is the established way this
app collapses a stack after a completed flow.

**What that precedent also shows.** `reset` with no `index` defaults to `routes.length - 1`, which
here is `0`. So after a successful redemption the `MainScreen` stack is exactly
`[TransactionSummary]` — `Main` is gone, along with `Entertainer`, the three material top tabs and
`HomeNavigation`. Every screen in the navigator has been disposed, including the one the user is
meant to return to.

Three consequences, all of which this feature must account for and none of which it should
unilaterally change:

1. **`Main` is not always in the stack.** This is what makes `navigate("Main", …)` and `popToTop()`
   wrong for `returnToMain()` rather than merely inelegant. From `TransactionSummary`,
   `popToTop()` is a no-op (index is already 0) and `navigate("Main", …)` finds no existing route
   and *pushes*, producing `[TransactionSummary, Main]` — a stack where `TransactionSummary` is
   mounted underneath the home screen indefinitely. `reset` produces `[Main]` from both.
2. **FR-007 is scoped to this feature's own operations.** "`Main` stays mounted throughout" is a
   constraint on what `012` does, not a claim about what the app does today. The redemption reset
   already violates it, and returning to `Main` afterwards remounts `Entertainer` from scratch.
3. **The header back button on `TransactionSummary` has nothing to go back to.** `navigation.js`
   registers it with `headerShown: true` and `gestureEnabled: false`; at stack index 0 the injected
   back action is a no-op, the same way `renderBackArrow`'s comment in `navigation.js` describes.

Whether the redemption flow *should* collapse the whole stack is a product decision about a flow
this feature does not own. It is recorded here because it changes the design of `returnToMain()`,
and flagged in `quickstart.md` as a thing to look at, not to fix.

**Alternatives considered**: *fold the redemption resets into `returnToMain()`* — rejected, it is a
different destination and a different intent, and merging them would silently change what happens
after a redemption.

---

## Open questions carried into Phase 1

None blocking. Two items are device-verification-only and are recorded as such in `quickstart.md`
rather than as unknowns:

- Whether `enableFreeze()` (US3) disturbs the `material-top-tabs` inside `Entertainer` or the
  `react-native-pager-view` under it. Static analysis cannot answer this; the mitigation is
  NFR-002 (one-line revert).
- Whether tearing down and rebuilding `GoogleMaps.View` on every focus change reads as a flicker on
  low-end Android. `expo-maps` is alpha ("will frequently experience breaking changes", per the note
  in `platformMap.component.js`), so this is measured, not predicted.
