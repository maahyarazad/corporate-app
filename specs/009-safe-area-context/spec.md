# Feature Specification: Safe Area Context Migration

**Feature Branch**: `009-safe-area-context`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "replace safearea.component.js with `import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'` … `<SafeAreaProvider><SafeAreaView style={{flex:1}}>`"

> **Note on provenance**: this spec was written *after* `plan.md`, to formalise the user stories that
> `/speckit-tasks` requires — the same order `005` used. It restates the plan's phases as testable
> slices and introduces no new scope. `plan.md`, `research.md`, `data-model.md` and
> `contracts/safe-area.md` remain the authority on mechanism.

## Summary

React Native's `SafeAreaView` is deprecated upstream and is a no-op on Android. This feature moves
the app onto `react-native-safe-area-context` — already a direct dependency at 5.6.2 — across the
36 files that consume a safe area today.

The request named one file. The survey found the real surface is larger and that the supplied
snippet bundles two changes belonging in different places:

- `SafeAreaProvider` is a context provider and belongs **once, at the `App.js` root**. Placing it
  inside the shared component would mount 38 of them.
- `SafeAreaView` is the piece that replaces the deprecated import inside the component.

Splitting those is what makes this shippable in independently revertable slices.

### What this feature does not claim

**No performance improvement is asserted.** This is a correctness and deprecation migration. The one
measurable structural win is removing a `styled-components` runtime wrapper from 38 call sites, and
no measurement of that exists.

### Evidence supplied

| Finding | Location | Verified against |
|---|---|---|
| RN `SafeAreaView` is deprecated | — | `react-native/Libraries/Components/SafeAreaView/SafeAreaView.js:25` |
| Library already installed | `package.json:114` | `react-native-safe-area-context@5.6.2` |
| Already used once | `entertainer.screen.js:18` | `useSafeAreaInsets` |
| 26 files via the wrapper, 38 call sites | `grep -rn "<SafeArea"` | — |
| 10 files import RN's directly | see `research.md` R3 | each import resolves to `"react-native"` |
| A provider already exists in-navigator | `research.md` R2 | `@react-navigation/elements/.../SafeAreaProviderCompat.js` — stands down under an existing provider |
| Second `no-restricted-imports` entry silently drops the first | `contracts/safe-area.md` | tested: 2 entries → 1 error; 1 combined entry → 2 errors |

## User Scenarios & Testing

### User Story 1 — The app no longer depends on a deprecated API (Priority: P1)

A developer greps the source for `SafeAreaView` imported from `react-native` and finds none. The app
builds and runs identically on both platforms.

**Why P1**: React Native states the component "will be removed in a future release". Every Expo SDK
bump carries the risk that it disappears. This is the reason the feature exists.

**Independent test**: `grep -rn "SafeAreaView" src | grep -v safe-area-context` returns nothing, and
the app boots on iOS and Android with no visual change.

### User Story 2 — Insets are available everywhere, including outside the navigators (Priority: P1)

A toast fires while a modal is open. It renders clear of the status bar and the home indicator.

Today `Toast` (`App.js:87`) and `ConfirmDialogHost` (`App.js:88`) render as siblings of
`<AppNavigation />`, so the only provider in the tree — mounted inside the stack navigators — is not
above them. They cannot read insets at all.

**Why P1**: it is the enabling change for everything else, and it is the one slice with no visual
risk, so it can ship first and alone.

**Independent test**: exactly one `SafeAreaProvider` exists, in `App.js`; a toast and a confirm
dialog both clear the system bars on a notched device; cold start shows no inset "jump" on frame 1.

### User Story 3 — Android screens stop rendering under the status bar (Priority: P2)

A user on Android opens the home feed, a post detail, or the post-entry flow. Content begins below
the status bar rather than beneath it.

Ten screens import RN's `SafeAreaView` directly and therefore never received the
`StatusBar.currentHeight` compensation the shared wrapper applies. On Android they have had **no top
inset at all**. Where a navigator header covers the gap this is invisible; on headerless screens it
is not.

**Why P2**: a real user-visible defect, but pre-existing rather than introduced, and it depends on
US1 landing first.

**Independent test**: on an Android device, each of the ten screens in `research.md` R3 shows its
first element below the status bar.

### User Story 4 — The deprecated import cannot come back (Priority: P3)

A developer types `import { SafeAreaView } from "react-native"` and lint rejects it before commit.

**Why P3**: guardrail, not function. Valuable because `002` established the pattern and because a
migration without a gate regresses.

**Independent test**: a file containing that import fails `npx eslint`, **and** a file importing
`Animated` from `react-native` still fails — proving the existing `002` ban survived the edit.

### Edge Cases

- **Rotation and Android navigation-mode switching** change insets while the app runs. Consumers must
  re-render; nothing may cache an inset at module scope.
- **`pointerEvents="box-none"`** is used at exactly one call site, `map.screen.js:457`. Dropping it
  makes the entire map untappable.
- **An absolutely-positioned safe area** (`map.screen.js:457`, `position: absolute` + `height: 100%`)
  receives insets as padding, which composes differently than on a flex child.
- **Nested safe areas** — `postCard.component.js` is a component, not a screen, and may render inside
  a screen that already wraps in `SafeArea`. That would apply the inset twice.
- **`profile.screen.js` uses both patterns** (`SafeArea` at `:65`, RN `SafeAreaView` at `:242`).

## Requirements

### Functional Requirements

- **FR-001**: The app MUST NOT import `SafeAreaView` from `react-native` anywhere in `src/`.
- **FR-002**: Exactly one `SafeAreaProvider` MUST be mounted, at the `App.js` root, inside
  `GestureHandlerRootView` (which `008` requires stay outermost).
- **FR-003**: The provider MUST be seeded with `initialWindowMetrics` so the first frame is not
  rendered with zero insets.
- **FR-004**: `SafeArea` MUST continue to forward `style`, `children` and `pointerEvents`, and MUST
  keep applying `flex: 1`.
- **FR-005**: `SafeArea` MUST accept an `edges` prop so a screen can opt out of an inset without
  reintroducing manual `StatusBar` arithmetic.
- **FR-006**: The component MUST NOT branch on `Platform.OS`; the `StatusBar.currentHeight`
  compensation is deleted, not relocated.
- **FR-007**: No inline style literals may be introduced — `check:styles` must stay green.
- **FR-008**: The lint ban MUST be added by extending the existing `no-restricted-imports` entry for
  `react-native`, never by adding a second entry for the same module.

### Key Entities

See `data-model.md`. In brief: the `SafeArea` prop contract, and the read-only `Metrics`
(`frame` + `insets`) published by the provider.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `grep -rn "SafeAreaView" src | grep -v safe-area-context` returns zero results.
- **SC-002**: `grep -rn "SafeAreaProvider" App.js src | grep -v Compat` returns exactly one result.
- **SC-003**: `grep -rn "StatusBar.currentHeight" src` returns zero results.
- **SC-004**: All five repo gates green — `npm test` (27/27), `check:styles`, `check:screen-props`,
  `check:animation`, `audit:lists`.
- **SC-005**: An `Animated` import from `react-native` is still flagged by ESLint after FR-008.
- **SC-006**: The map remains interactive — pan, zoom and marker taps all work through the overlay.

Every one of SC-001 through SC-005 is checkable without a device. SC-006 is not.

## Assumptions

- The `edges` default is **not** assumed. `research.md` R5 records both options and requires a device
  decision; the recommendation is to ship behaviour-neutral (`["top"]`) first.
- Device availability is not assumed. `006` and `007` both correctly stopped for want of an Android
  device. If none is available, work stops after US2, which carries no visual risk.
- No visual-regression harness exists or will be built here; the checks in `quickstart.md` are the
  contract tests and they are manual.
