# Implementation Plan: Disposing Profile and Map when returning to Main

**Branch**: `012-dispose-profile-and` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-dispose-profile-and/spec.md`

## Summary

Make the return to `Main` a single operation that provably leaves one screen standing, and give the
`Map` screen a way to release its native map while it is covered.

The request — "in the MainScreen when switch from other screen they should be dispose specially the
ProfileScreen and MapScreen when switch to MainScreen" — reads as a bug report. Research found it
half true, and the plan splits accordingly:

- **The documented return paths already dispose correctly.** `StackRouter`'s `NAVIGATE` truncates the
  stack on a hit (`research.md` R1), so `goHome` and `goBack()` really do unmount `Profile` and
  `Map`. No work is planned against that.
- **Everything else does not.** A covered `Map` keeps a live `GoogleMaps.View` and 100 markers while
  `Location View` — which mounts a *second* map (`research.md` R3a) — sits on top of it. A deep link
  can stack `Map` over `Profile` indefinitely (R3b). Nothing calls `enableFreeze()`, so covered
  screens also keep re-rendering (R2). And after a redemption the stack does not contain `Main` at
  all (R8), which makes the obvious `navigate("Main")` fix actively wrong.

Four changes, in dependency order: a `returnToMain()` helper built on `reset`; a focus gate on the
map element; a static gate so the convention holds; and the app-wide freeze switch last, because it
is the only one that touches screens outside this feature.

"State will lose" is not a compromise here — it is the premise that makes all four cheap.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 19.1.0, React Native 0.81.5, Expo SDK 54

**Primary Dependencies**: `@react-navigation/native@7.3.18`, `@react-navigation/native-stack@7.18.10`,
`@react-navigation/stack@7.10.24`, `@react-navigation/material-top-tabs@7.6.17`,
`react-native-screens@~4.16.0`, `react-freeze@1.0.4` (transitive), `expo-maps@~0.12.10`

**Storage**: none added. Reads the `api_cache` table `011` built (`utils/cacheDb.js`), for FR-005.

**Testing**: `jest` with the `jest-expo` preset; `testMatch` already covers
`**/src/**/__tests__/**/*.test.js`. No renderer for `expo-maps`, so lifecycle behaviour is device-verified.

**Target Platform**: iOS and Android, via a dev build (Expo Go cannot load `expo-maps`)

**Project Type**: mobile app — single React Native codebase, no backend in this repo

**Performance Goals**: release one native map surface at the moment it is covered rather than at
pop; stop covered screens re-rendering on unrelated context writes. No frame-rate or memory target
is claimed — see Constraints.

**Constraints**: OTA-shippable, no native change (NFR-001). The freeze switch must be revertible by
deleting one line (NFR-002). No screen may preserve state across disposal (FR-006). The map gate
must not alter hook order (`data-model.md` V9).

**Scale/Scope**: one navigator (`MainScreen`, 10 routes), 2 screens modified, 1 helper added,
1 script added, 1 test suite added. No API surface changes.

### Deliberately not marked NEEDS CLARIFICATION

Two questions are genuinely open but are *measurements*, not unknowns blocking design. They are
carried as device-verification items in `quickstart.md` §3.5 and `research.md`, with NFR-002 as the
mitigation:

- whether `enableFreeze()` disturbs `material-top-tabs` / `react-native-pager-view`;
- whether rebuilding `GoogleMaps.View` on focus reads as a flicker on low-end Android.

Marking these NEEDS CLARIFICATION would imply a human can answer them from a chair. They need a
device.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is **an unmodified template** — every principle is still a
`[PRINCIPLE_N_NAME]` placeholder and the governance section is `[GOVERNANCE_RULES]`. There are no
ratified principles to check against, so this gate is vacuous rather than passed. Recorded plainly
rather than reported as green.

The repository does enforce real, executable conventions, and those are treated as the operative
gates for this feature:

| Gate | Command | Bearing on this feature |
|---|---|---|
| Tests | `npm test` | US1's action-shape suite must pass |
| Lint | `npm run lint` | `"lint": "eslint src"` — it lints the new helper in `src/navigation/`, and does **not** lint `scripts/check-main-stack-return.js`, in common with the five gate scripts already there |
| Stylesheet scope | `npm run check:styles` | no new `StyleSheet` — neutral |
| Screen props | `npm run check:screen-props` | `map.screen.js` must keep using `useNavigation()`, never a `navigation` prop |
| Animation | `npm run check:animation` | no animation change — neutral |
| List audit | `npm run audit:lists` | no list change — neutral |
| Cache coverage | `npm run check:cache-coverage` | `012` adds no endpoint; must stay green |
| **Main-stack return** | `npm run check:main-return` | **added by this feature** (US4) |

**Post-Phase-1 re-check**: unchanged. The design adds one npm script and one node script in the
established style (NFR-004), modifies no existing gate, and introduces no dependency. Nothing in
Phase 1 moved the feature toward needing an exemption.

### Complexity note

Adding an eighth static gate is the one place this plan spends complexity. It is justified in
`research.md` R6 and US4: the guarantee in `contracts/screen-lifecycle.md` §1 is a property of call
sites, and R8 shows the obvious wrong call site is not merely untidy but broken from
`TransactionSummary`. A convention that costs correctness when violated, and is violated by the
most natural thing to type, needs a gate. See Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/012-dispose-profile-and/
├── plan.md                          # This file
├── spec.md                          # Feature specification
├── research.md                      # Phase 0 — R1..R8
├── data-model.md                    # Phase 1 — E1 MainScreenStack, E2 ReturnToMainAction, E3 ScreenLifecycleState
├── quickstart.md                    # Phase 1 — validation guide, unit + device
├── contracts/
│   └── screen-lifecycle.md          # Phase 1 — returnToMain(), the focus gate, the static gate
└── tasks.md                         # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

Only the files below are touched. Paths are real and were read during Phase 0.

```text
navigation.js                                   # MainScreen navigator — READ ONLY, no change planned
App.js                                          # US3 only: the single enableFreeze() call

src/
├── navigation/
│   ├── navigate.js                             # US1: add returnToMain() beside navigate/goback
│   └── __tests__/
│       └── navigate.test.js                    # US1: new — action shape, defaults, isReady guard
├── screens/
│   ├── map.screen.js                           # US2: useIsFocused gate on the PlatformMap element
│   └── profile/
│       └── profile.screen.js                   # US1: goHome (line 43) -> returnToMain()
└── components/map/
    └── platformMap.component.js                # READ ONLY — mounted/unmounted, never modified

scripts/
└── check-main-stack-return.js                  # US4: new gate, modelled on check-screen-props.js

package.json                                    # US4: "check:main-return" script entry
```

**Structure Decision**: this is Option 3 (mobile) with no `api/` half — the backend is a separate
service this repo does not contain. The app does not use a `src/models` / `src/services` split for
navigation; `src/navigation/navigate.js` is already the single module every non-screen call site
imports for navigation, which is why the helper goes there rather than into a new module. Tests
follow the repo's colocated `__tests__` convention (`src/utils/__tests__`, `utils/__tests__`), which
`jest.config.js` already matches.

## Phase ordering and independence

Each story is independently revertible (`quickstart.md` §5), which is what allows them to ship
separately.

| Order | Story | Priority | Why here |
|---|---|---|---|
| 1 | US1 — `returnToMain()` | P1 | Nothing depends on it, and US4 gates it. Must exist before the gate that enforces it. |
| 2 | US2 — map focus gate | P1 | Independent of US1. The largest single win (`research.md` R3a, the doubled map surface). |
| 3 | US4 — static gate | P2 | Must follow US1, because it fails on the call site US1 removes. |
| 4 | US3 — `enableFreeze()` | P2 | Last, and alone in its commit: app-wide blast radius, one-line revert. |
| — | US5 — Profile release | P3 | Optional. US3 already stops it rendering; the remaining cost is a mounted subtree with no native view. |

US2 before US4 is not a dependency, only a value ordering — if the schedule tightens, US2 alone is a
shippable improvement.

## Complexity Tracking

> Filled because the Constitution Check has no ratified principles to justify against, and one
> decision still warrants the argument.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| An eighth static gate (`check:main-return`) | The `returnToMain()` guarantee is a property of call sites, not of the navigator, so nothing structural preserves it. `research.md` R8 shows the natural alternative — `navigate("Main")` — is not a style lapse but produces `[TransactionSummary, Main]`, a stack with a receipt mounted under the home screen. | *A code comment* — the five existing gates exist because comments did not hold. *An ESLint `no-restricted-syntax` rule* — workable, and `lint` already covers `src`, but it would make this the only convention in the repo enforced differently from the other five; consistency of enforcement is worth more here than saving a file. *No gate* — leaves the guarantee alive until the next contributor adds a home button. |
| App-wide `enableFreeze()` for a feature scoped to two screens | `react-native-screens@4.16.0` exposes freezing only as a global switch: `Screen.js:39` reads `freezeEnabled()`, and `@react-navigation/native-stack@7.18.10` forwards no `freezeOnBlur` screen option (zero hits under its `lib/`). There is no narrower form of this change. | *A per-screen option* — does not exist at this version. *Patching native-stack to forward `shouldFreeze`* — possible, this repo runs `patch-package`, but a library patch to scope a one-line switch is worse than the switch. *Skipping it* — leaves US3 undone; it is ordered last and reverts in one line instead. |
