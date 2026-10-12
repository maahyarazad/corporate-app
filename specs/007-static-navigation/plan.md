# Implementation Plan: Static Navigation API + Native Stack

**Branch**: `007-static-navigation` (not yet created — branch from `005-static-screen-options`)
**Date**: 2026-08-31
**Input**: A React Navigation 7 snippet using `createNativeStackNavigator` + `createStaticNavigation`

## Summary

The snippet bundles **three independent migrations**. Separating them is the single most useful
thing this plan does, because only one of them addresses the Android lag you are actually chasing:

| # | Migration | Addresses the Android lag? | Cost |
|---|---|---|---|
| **A** | `@react-navigation/*` **6.0.10 → 7.x** | No — prerequisite only | Medium; breaking changes across 41 screens |
| **B** | `createStackNavigator` → **`createNativeStackNavigator`** | **Yes — this is the fix** | Medium; option API differs |
| **C** | Dynamic JSX config → **`createStaticNavigation`** | **No — zero runtime effect** | High; see the root-switch problem below |

A is a prerequisite for both B and C. **B can ship without C.** C is ergonomics and type-safety, not
performance — it changes how navigators are *declared*, not how they *run*.

Given `006`'s open question (is the lag the transition or the destination screen's mount?), the
recommended sequence is **A → B → measure → then decide on C**. Doing C first spends the largest
budget on the piece that cannot move the number.

### The central obstacle: a five-way root switch

`navigation.js` does not have one root navigator. `renderNavigator()` returns a **different
navigator** depending on state:

```
!assets            → splash <Image>
noConnection       → TimeoutStackScreen
isOutdated         → VersionMismatchScreen
phoneVerified && refreshToken
   ├ isAuthorized || isSkip → MainScreen
   └ else                   → ApprovalScreen
else               → AuthStackScreen
```

`createStaticNavigation` produces **one** `<Navigation />` from **one** static tree. React
Navigation 7 expresses conditionals as `if`-guarded **groups inside a single navigator**
(`useIsSignedIn`-style guards), not by swapping navigators. So migration C is not a syntax
conversion — it requires collapsing five root navigators into one guarded tree, which changes
back-stack behaviour at every state boundary. That is a design change, and it is why C is scoped
last and separately.

**Also blocking C**: `renderNavigator()` calls `useAssets(...)` and `useEffect(...)` **inside a
nested function**, gating the whole tree on an 80-asset preload. It works today only because the
function is invoked exactly once per render. A static tree cannot contain that gate, so the asset
preload must move out before C is possible — see `research.md` R5.

## Technical Context

**Current**: `@react-navigation/native` 6.0.10, `stack` 6.2.1, `material-top-tabs` 6.6.14,
`bottom-tabs` 6.3.1 (**unused — zero imports**), `elements` 1.3.31. Versions are drifted within the
v6 line.

**Target**: `@react-navigation/*` 7.x + `@react-navigation/native-stack` (**not currently installed**).

**Peer support**: `react-native-screens` **4.16.0** — satisfies v7's `>= 4.0.0`. No native dependency
change is required, so this is a JS-only migration with a rebuild.

**Platform**: RN 0.81.5, Expo SDK 54, Fabric enabled, Hermes.

**Scale**: **41 screens** across 6 stack navigators + 1 material-top-tab navigator.

| Navigator | Screens |
|---|---|
| `AuthStack` | 15 |
| `MainStack` | 10 |
| `OverlappingStack` | 10 |
| `ApprovalStack` | 4 |
| `TimeoutStack` | 1 |
| `HomeStack` | 1 |
| `Tab` (material-top-tabs) | 3 |

**Deep linking**: no `linking` config on `NavigationContainer`; URLs are handled manually in
`src/utils/urlRouter.js`. Less to migrate, and v7's static API can generate a linking config from
the screen tree later — recorded as an opportunity, not scope.

**Testing**: Jest, 27 tests, pure logic. No navigation tests. Verification is manual on device.

## Constitution Check

`.specify/memory/constitution.md` is still an unpopulated template — no ratified gates. Self-imposed:

| Gate | Status |
|---|---|
| Each migration independently shippable and revertable | PASS — A, B, C are separate phases with separate commits |
| No migration ships without a device pass | PASS — enforced in `quickstart.md` |
| Perf claims backed by a measurement | PASS — only B may claim a perf effect, and only after `006`'s T006 |
| Scope honesty: C is not sold as a performance fix | **PASS — stated explicitly above and in `research.md` R1** |

## Migration Surface

Full detail in **[data-model.md](./data-model.md)**. The parts that are not mechanical:

| Concern | Count | Why it matters |
|---|---|---|
| Custom `headerTitle` | 26 | native-stack renders headers **natively**; component titles are supported but centre/measure differently |
| Custom `headerLeft` | 18 | Same, plus the back-button interaction is native |
| Custom `headerRight` | 9 | Includes `changeHeaderRight` via `navigation.setOptions` in `src/screens/entertainer.screen.js` |
| `cardStyleInterpolator` | 4 | **No equivalent.** Becomes `animation: "slide_from_right"` |
| `cardStyle` | 4 | **No equivalent.** Becomes `contentStyle` |
| `gestureResponseDistance` | 4 | Exists but numeric-only in native-stack |
| `gestureDirection` | 5 | Narrower support |
| `detachPreviousScreen` | 2 | **No equivalent** — native-stack manages this itself |

**Checked and clear**: the 5 `header:` grep hits are StyleSheet keys, not the navigation `header`
option. There are no fully-custom headers to port — that would have been the worst case.

## Phased Approach

**Phase A — Version alignment** (T-01…T-05): align the drifted v6 versions first, drop the unused
`bottom-tabs`, confirm green. Cheap, and it de-risks the v7 jump by removing one variable.

**Phase B — v6 → v7** (T-10…T-19): the upgrade itself, with the dynamic JSX config **unchanged**.
Every navigator keeps `createStackNavigator`. This isolates "did the upgrade break anything" from
"did native-stack break anything".

**Phase C — native-stack, one navigator at a time** (T-20…T-33): start with `AuthStack` (15 screens,
self-contained, no custom headers on most). Measure. Only then convert the rest.

**Phase D — Measure** (T-40…T-43): the point of the exercise. Compare against `006`'s baseline.

**Phase E — Static API** (T-50…T-59) — **contingent and last**. Requires the asset-preload extraction
and the five-way root collapse. Do not start until B and C are shipped and measured.

Task breakdown belongs in `tasks.md` — run `/speckit-tasks` next.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Splitting the snippet into 3 migrations | Only one of them can affect the lag; bundling them makes attribution impossible | Doing it as one change means a 41-screen diff with no way to tell which part helped or broke something |
| Per-navigator native-stack conversion | 41 screens with 53 custom-header options is too large to land atomically | A big-bang conversion cannot be measured incrementally or reverted narrowly |
| Static API deferred to last | It requires collapsing five root navigators into one guarded tree — a behaviour change at every auth boundary | Doing it early blocks the perf work behind a design decision |

## Progress

- [x] Phase 0: Research → `research.md`
- [x] Phase 1: Design → `data-model.md`, `contracts/`, `quickstart.md`
- [x] Constitution check (vacuous — template unpopulated)
- [ ] Phase 2: Tasks (`/speckit-tasks`)
- [ ] Phase 3: Implementation (`/speckit-implement`)
