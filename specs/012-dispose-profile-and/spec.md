# Feature Specification: Disposing Profile and Map when returning to Main

**Feature Branch**: `012-dispose-profile-and`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "in the MainScreen when switch from other screen they should be dispose specially the ProfileScreen and MapScreen when switch to MainScreen - and it is fine when use navigate away the state will lose"

> **Note on provenance**: written alongside `plan.md`, in the same order `005`, `009`, `010` and `011`
> used. `plan.md`, `research.md` and `contracts/screen-lifecycle.md` remain the authority on
> mechanism.

## Summary

Guarantee that every route of the `MainScreen` navigator other than `Main` is torn down when the
user returns to `Main`, and that the two heaviest of them — `Profile` and `Map` — also release
their native resources while they are merely *covered* by another screen.

The user has explicitly accepted that these screens lose their state. That acceptance is what makes
this feature cheap: no preservation, no restore, no serialisation. A returned-to `Map` refetches its
coordinates (from SQLite, per `011`) and reseeds its camera; a returned-to `Profile` refetches its
partner title.

### Scope correction

The request reads as "they are not disposed today". Research found that half-true, and this spec
splits it:

- **On the documented return paths they already unmount.** `@react-navigation/routers@7.x`
  `StackRouter` truncates the stack on `NAVIGATE` to an existing route (`research.md` R1), so
  `goHome` at `profile.screen.js:43` and `navigateBack` at `map.screen.js:296-297` really do remove
  those routes and destroy their React state. Restating that as the feature would be shipping a
  no-op.
- **On every other path they are not.** A deep link to `Map` fired while `Profile` is open
  (`urlRouter.js:19`) leaves Profile mounted underneath for the rest of the session. A tap through
  from Map into a partner (`map.screen.js:223`) leaves a live `GoogleMaps.View` and its 100 markers
  alive behind up to four more screens. Nothing calls `enableFreeze()`, so a covered screen also
  keeps re-rendering on every context change (`research.md` R2, R3).

So this feature is **not** "make them unmount". It is: make unmounting unconditional rather than
path-dependent, and release what unmounting alone never reaches.

### What this feature does not claim

**It is not a memory-leak fix.** No retained-reference leak was found. The cost this removes is a
live native view and a rendering subtree held longer than needed, not an unbounded one.

**It does not preserve anything.** State loss is the explicit premise, not a regrettable side
effect.

**It does not change `Main`.** `Main` — the `OverlappingNavigator`, its `Entertainer` screen and the
three material top tabs — stays mounted throughout. Disposing it is the opposite of what was asked.

**It adds no native code.** Every change is JS and ships over OTA.

### Evidence supplied

| Finding | Location | Verified against |
|---|---|---|
| `navigate()` to an existing route truncates the stack | `research.md` R1 | `@react-navigation/routers/lib/commonjs/StackRouter.js:224-289` |
| The two documented return paths therefore already unmount | `research.md` R1 | `profile.screen.js:43`, `map.screen.js:296-297` |
| Freezing is off app-wide — nothing calls `enableFreeze()` | `research.md` R2 | `App.js`, `index.js`, `src/`, `hooks/` |
| `freezeOnBlur` is not a native-stack v7 screen option | `research.md` R2 | zero hits under `@react-navigation/native-stack/lib/` |
| The only freeze switch is the global one | `research.md` R2 | `react-native-screens/.../Screen.js:39,116` |
| Map stays mounted behind pushed screens | `research.md` R3a | `map.screen.js:223` → `Location View` → `AvailOffer` |
| `Location View` mounts a **second** native map over the first | `research.md` R3a | `location-view.screen.js:25`, `map.component.js:3,33` |
| Deep links can stack Map over Profile | `research.md` R3b | `urlRouter.js:19`, `header.component.js:71-73` |
| Map holds a native map view and 100 serialised markers | `research.md` R4 | `map.screen.js:38`, `platformMap.component.js` |
| `reset` is already this repo's idiom for collapsing a stack | `research.md` R8 | `availOffer.screen.js:168-170`, `offerRedeemForm.js:111-113` |
| Those resets leave `Main` out of the stack entirely | `research.md` R8 | same, `index` defaults to `routes.length - 1` = 0 |
| The repo already gates conventions statically | `research.md` R6 | `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`, `check:cache-coverage` |

## User Scenarios & Testing

### User Story 1 — Returning to Main always leaves one screen standing (Priority: P1)

A member wanders from Home into Map, taps a partner, opens the offer, avails it, reaches the
transaction summary, and then goes home. Nothing from that journey is still mounted.

Today the outcome depends on *how* they go home. `goHome` truncates correctly, and a chain of
`goBack()` also arrives at `[Main]`. But there is no single call every path uses, so a new "back to
home" affordance added anywhere in the app is one `navigate("Main")` away from being correct and one
`push` away from not being.

**Why P1**: it is the requirement as stated, and it is the only story that makes the guarantee
structural instead of incidental.

**Independent test**: from a stack five deep, invoke the return helper and assert the resulting
navigation state has exactly one route, named `Main`. Assert it on the dispatched action, not on a
screenshot.

### User Story 2 — A covered Map releases its native map (Priority: P1)

A member taps a partner pin and opens the partner. While they read it, the map behind them is gone —
not hidden, gone. Coming back redraws it from the SQLite cache.

`map.screen.js:223` pushes `Location View` over the map. `Map` stays mounted, so `GoogleMaps.View`
(or `AppleMaps.View`) keeps its 100 markers and its location fix alive for as long as the user stays
above it, which is unbounded.

Worse than that: `Location View` mounts a map of its own (`location-view.screen.js:25` →
`map.component.js`, the static preview, which renders the same `PlatformMap`). So this transition
holds **two live native map surfaces at once** rather than swapping one for the other.

**Why P1**: this is the concrete cost the user named — "specially the ProfileScreen and MapScreen" —
and the only one of the two that holds a native view. The doubled surface makes it the largest
single win in the feature.

**Independent test**: cover the map, confirm the native map view is torn down, uncover it and
confirm it redraws with markers and no re-fetch over the network (the coordinates come from cache).

### User Story 3 — A covered screen stops doing work (Priority: P2)

While the member is on `Location View`, neither `Map` nor `Entertainer` re-renders when an unrelated
context writes.

Nothing calls `enableFreeze()`, so `react-native-screens` leaves `freezeOnBlur` false
(`Screen.js:39`) and every mounted-but-blurred screen re-renders on every context change above it —
`LocationContext` alone writes on location, event-list and language changes.

**Why P2**: it depends on nothing, but it is app-wide and touches screens outside this feature, so
it must land after the two targeted stories and be revertible in one line.

**Independent test**: not observable statically. Instrument a render counter on a blurred screen and
confirm it stops advancing; verify on device that no screen breaks.

### User Story 4 — The guarantee cannot be broken by the next commit (Priority: P2)

An engineer adding a new "home" button cannot reintroduce a path that leaves Profile or Map mounted.

**Why P2**: the repo has five static gates already; a convention with no gate is a convention that
lasts until the next contributor.

**Independent test**: add a file calling `navigate("Main")` directly and confirm the gate fails.

### User Story 5 — Profile releases its subtree when covered (Priority: P3)

`Profile` hosts a nested `createStackNavigator` and `ProfTabs`. It holds no native view, so covering
it costs a rendering subtree rather than a GPU surface.

**Why P3**: real but small, and US3 already stops it rendering. Listed so it is a decision rather
than an omission.

**Independent test**: cover Profile, return, confirm the partner title refetches and the nested
stack is back at `MainProfile`.

## Requirements

### Functional

- **FR-001**: Returning to `Main` MUST leave the `MainScreen` stack with exactly one route, `Main`, regardless of the stack's prior depth or contents.
- **FR-002**: Every route in `MainScreen` other than `Main` MUST be unmounted by that return, and its React state destroyed.
- **FR-003**: The return MUST be able to select a tab inside `Main` in the same operation, since that is what `goHome` does today.
- **FR-004**: `Map` MUST tear down its native map view while it is not the focused screen.
- **FR-005**: A `Map` that regains focus MUST redraw without requiring a network request when its coordinates are cached.
- **FR-006**: No screen may be required to preserve or restore state across a disposal.
- **FR-007**: No operation introduced by this feature may dispose `Main` or anything inside it. This constrains `012`'s own work only — it is not a claim about the app today, where the redemption reset at `availOffer.screen.js:168-170` already leaves `Main` out of the stack (`research.md` R8).
- **FR-011**: The return MUST produce `[Main]` even when `Main` is not currently in the stack, which is the state `TransactionSummary` is reached in.
- **FR-008**: The existing `navigate()` call sites MUST keep their current route names and signatures.
- **FR-009**: A disposal MUST NOT surface an in-flight request's cancellation as an error; aborted work stays silent, per the existing `isCancel` handling.

### Non-functional

- **NFR-001**: No native change — the feature ships over OTA.
- **NFR-002**: The app-wide freeze switch (US3) MUST be revertible by deleting one line.
- **NFR-003**: All repo gates stay green: `npm test`, `lint`, `check:styles`, `check:screen-props`, `check:animation`, `audit:lists`, `check:cache-coverage`.
- **NFR-004**: The new gate MUST run in the same style as the five existing ones — a node script under `scripts/`, wired to an npm script.

### Testing

The stack-shape half of this feature is unit-testable without a device: a dispatched navigation
action is a plain object. **Tests are in scope** and must cover at minimum: the reset action's
shape, the tab-selection nesting inside it, and idempotence when already on `Main`.

The lifecycle half (FR-004, US3) is not unit-testable here — `jest-expo` has no renderer for
`expo-maps` — and follows the device-verification precedent set by `009` and `010`.

## Success Criteria

- **SC-001**: After any return to Main, the navigation state has one route.
- **SC-002**: Covering the map destroys its native view; uncovering it redraws it.
- **SC-003**: Returning to a previously visited Map or Profile issues no network request that the cache can serve.
- **SC-004**: A blurred screen's render count does not advance.
- **SC-005**: A direct `navigate("Main")` added anywhere in `src/` fails the new gate.
- **SC-006**: No screen outside `MainScreen` changes behaviour.

## Out of Scope

- Preserving or restoring any disposed screen's state.
- Disposing `Main`, `Entertainer`, or the material top tabs.
- Changes to the `AuthStackScreen`, `ApprovalScreen` or `TimeoutStackScreen` roots.
- Replacing `navigate()` with typed navigation helpers app-wide.
- Any change to `expo-maps` or `platformMap.component.js` beyond mounting and unmounting it.
