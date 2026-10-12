# Contract: Screen lifecycle in the `MainScreen` navigator

**Feature**: `012-dispose-profile-and` | **Date**: 2026-09-10

This app exposes no HTTP API and no CLI. Its contracts are the interfaces one part of the codebase
offers another — the same way `010` documented `platformMap.component.js` in
`specs/010-expo-maps/contracts/platform-map.md`. This file is the equivalent for screen lifecycle:
what `returnToMain()` promises its callers, and what a screen must do to opt into resource release.

Vocabulary (`Focused`, `Covered`, `Released`, `Disposed`) is defined in `data-model.md` E3.

---

## 1. `returnToMain(tab?)`

**Module**: `src/navigation/navigate.js` — alongside the existing `navigate` and `goback`, over the
same `navigationRef`.

```
returnToMain()          // returns to Main, Home tab
returnToMain("Offers")  // returns to Main, Offers tab
```

### Guarantees

| # | Guarantee |
|---|---|
| G1 | After the call resolves, the `MainScreen` stack is exactly `[Main]`. |
| G2 | Every other route is `Disposed` — unmounted, state destroyed, `useEffect` cleanups run. |
| G3 | G1 holds regardless of the prior stack, **including a stack that does not contain `Main`**. |
| G4 | The named tab inside `Entertainer` is selected in the same dispatch — no intermediate frame shows a different tab. |
| G5 | It is safe to call when already at `[Main]`; the result is `[Main]` with the tab applied. |
| G6 | It is a no-op when `navigationRef.isReady()` is false, matching `navigate` and `goback`. |

### Non-guarantees

- **Nothing is preserved.** A screen disposed by this call does not get to save anything first
  (FR-006). Callers needing a value to survive must have written it somewhere durable already.
- **It is not a "back".** It does not consult history and it is not the inverse of a push. Code
  wanting "one step back" must keep using `goback()`.
- **It does not animate as a pop.** `reset` replaces the stack; the transition is whatever
  native-stack does for a state replacement, not the `slide_from_right` a pop would give.

### Signature

`tab` is optional, defaults to `"Home"`, and must name a route on the `Tab.Navigator` in
`entertainer.screen.js` (`data-model.md` E2). No runtime validation — React Navigation's own
warning is the single source of truth for that list.

### Required action shape

Exactly `data-model.md` E2. Two properties are contractual rather than incidental:

- **`index: 0` is written explicitly.** Omitting it is correct today only because there is one
  route. `research.md` R8 is what an omitted `index` already costs elsewhere in this codebase.
- **The nested `params` are `{ screen: "Entertainer", params: { screen: tab } }`.** The comment at
  `profile.screen.js:38-42` explains why a flat `{ screen: tab }` cannot work: `Home` is two
  navigators down, not one.

### Callers

`returnToMain()` replaces `goHome` at `src/screens/profile/profile.screen.js:43`. That is the only
existing caller. Every future "go home" affordance must use it — enforced by §3.

---

## 2. The focus gate

**Applies to**: `src/screens/map.screen.js` in this feature. Written generally so `Profile` (US5)
can adopt it without a second contract.

### Rule

A screen holding a native view opts into `Covered → Released` by rendering that view only while
focused:

```
const isFocused = useIsFocused();
...
{isFocused && partnerLocations && myLocation ? <PlatformMap ... /> : <LoadingOverlay display />}
```

### Requirements on an adopting screen

| # | Requirement |
|---|---|
| C1 | The gate wraps an **element**, never the screen's return value. A gated early return changes hook order — see `map.screen.js`'s "FIX 10" comment for the crash this prevents. |
| C2 | `useIsFocused()` is called unconditionally, above every early return, with the other hooks. |
| C3 | The screen must already be safe to remount: no controlled native props that fight a fresh mount, and no data that a remount cannot re-obtain cheaply. `map.screen.js` satisfies both — the camera is uncontrolled after mount, and coordinates come from SQLite under a 1-hour TTL. |
| C4 | The blurred branch must render something with the same layout footprint. `map.screen.js` already has `<LoadingOverlay display={true} />` as the not-yet-loaded branch; reusing it means the gate adds no new visual state. |
| C5 | State that only makes sense with the view present must reset on release. For `map.screen.js` that is `showPartnerDetails` — a partner card floating over a torn-down map is the one visible defect this gate can cause. |

### What the gate does not do

- It does not unmount the screen. The screen stays `mounted`; only its native child goes.
- It does not stop the screen re-rendering. That is US3's `enableFreeze()`, and the two are
  independent — `research.md` R2 establishes that freezing suspends rendering and leaves native
  views in place, which is why neither substitutes for the other.
- It does not abort in-flight requests. Those are bound to the screen's own unmount
  (`research.md` R7), which the gate does not trigger.

---

## 3. The static gate

**Script**: `scripts/check-main-stack-return.js`, wired as `check:main-return` in `package.json`,
in the style of `scripts/check-screen-props.js`.

### Rule

No file under `src/` may call `navigate("Main", …)` or `<anything>.navigate("Main", …)`. The return
to `Main` goes through `returnToMain()`.

### Rationale

The guarantee in §1 is a property of a call site, not of the navigator. Without a gate it survives
until the next contributor adds a home button and reaches for the obvious `navigate("Main")` — which
`research.md` R8 shows is not merely stylistically worse but wrong from `TransactionSummary`, where
it pushes instead of returning.

### Expected state on introduction

Green. `navigate("Main"` appears exactly once in `src/` today (`profile.screen.js:43`), and that
call site is what this feature replaces.

### Exemptions

`src/navigation/navigate.js` itself, which is where the reset lives. The script must exclude it by
path, not by a comment pragma — the other five gates in this repo take the same approach.

---

## 4. Compatibility

| Surface | Change |
|---|---|
| Route names in `navigation.js` | none |
| `navigate()` / `goback()` signatures | none |
| Existing `navigate()` call sites | none, except `profile.screen.js:43` |
| `platformMap.component.js` | none — it is mounted and unmounted, not modified |
| `expo-maps`, native config, `app.json` | none — OTA-shippable (NFR-001) |
| `utils/cacheDb.js`, `utils/apiCache.js` | none — `012` reads the cache `011` built |
