# Phase 0 Research: Static Navigation + Native Stack

---

## R1 — Which part of the requested snippet actually addresses the Android lag?

**Decision**: Only `createNativeStackNavigator`. `createStaticNavigation` has **zero runtime effect**
on transition performance.

**Rationale**: The snippet contains two orthogonal changes that are easy to conflate.

- `createNativeStackNavigator` swaps the **renderer**. `@react-navigation/stack` animates
  transitions in JavaScript — it drives an `Animated` value and interpolates card position, overlay
  opacity and shadow every frame. `native-stack` delegates to the platform: `UINavigationController`
  on iOS, `Fragment` transitions on Android. The animation stops being JS work entirely. That is the
  documented cause of "transitions are laggy only on Android", and it is what `006` F2 identified.
- `createStaticNavigation` changes **how navigators are declared** — a config object instead of JSX
  children. It exists for type inference, automatic deep-link config generation, and less
  boilerplate. At runtime it builds the same navigator tree. It cannot make a transition faster.

**This matters for sequencing**: if the static API is migrated first, the largest and riskiest part
of the work lands before anything measurable changes, and if the lag persists there is no way to
tell whether the renderer swap would have fixed it.

**Alternatives considered**: Doing both at once as the snippet implies — rejected. A 41-screen diff
that changes both declaration style and renderer makes attribution impossible when something
regresses, and something will.

---

## R2 — What breaks when `createStackNavigator` becomes `createNativeStackNavigator`?

**Decision**: Convert per navigator, mapping options explicitly. Four options have no equivalent.

**Rationale**: native-stack's option set is deliberately smaller because the platform owns the
transition. Verified against the current source:

| v6 stack option | Uses | native-stack equivalent |
|---|---|---|
| `cardStyleInterpolator: forHorizontalIOS` | 4 | **None.** `animation: "slide_from_right"` |
| `cardStyle` | 4 | `contentStyle` |
| `gestureResponseDistance` | 4 | Same name, **number only** (v6 accepted an object) |
| `gestureDirection` | 5 | Supported, narrower set |
| `detachPreviousScreen` | 2 | **None** — native-stack handles this itself; delete |
| `headerShown` | many | Unchanged |
| `animationEnabled` | — | `animation: "none"` |

**The real risk is headers, not options.** native-stack renders the header as a **native** view:

- `headerTitle` (26 uses) — a component title is supported, but native centring and measurement
  differ from the JS header. Long titles truncate differently.
- `headerLeft` (18 uses) — the back button is native; a custom `headerLeft` replaces it and loses
  the platform back gesture affordance unless configured.
- `headerRight` (9 uses) — includes `changeHeaderRight` in `src/screens/entertainer.screen.js`,
  which sets `headerRight` imperatively through `navigation.setOptions`. That still works, but the
  component is now hosted natively.

**Checked and clear**: five `header:` grep hits are all StyleSheet keys
(`comment.component.js`, `postDetailMarketplace.screen.js`, `events.screen.js`,
`hotpicks.component.js`, `mediaUploader.component.js`), **not** the navigation `header` option.
A fully-custom header would have been the worst case for this migration; there are none.

**Alternatives considered**: `@react-navigation/stack` with a cheaper interpolator — that is `006`
US1, a partial fix that keeps the animation on the JS thread. Worth trying first because it is one
line, but it is not the structural answer.

---

## R3 — Is v7 required, and what does the upgrade cost?

**Decision**: Yes, v7 is required for `createStaticNavigation`. `native-stack` alone does **not**
require it.

**Rationale**: `createStaticNavigation` was introduced in React Navigation **7**. The project is on
`@react-navigation/native` **6.0.10**. `@react-navigation/native-stack` exists for v6 too, so
migration B could technically ship on v6.

However v6.0.10 is old even within its own line — siblings have drifted to `stack` 6.2.1 and
`material-top-tabs` 6.6.14 — and v7 is the line that targets the New Architecture, which this app
runs (`newArchEnabled=true`, Fabric). Upgrading is worth doing regardless.

**Peer requirement satisfied**: v7 needs `react-native-screens >= 4.0.0`; the project has **4.16.0**.
No native module changes, so this is a JS-only upgrade plus a rebuild.

**Cheap win available first**: `@react-navigation/bottom-tabs` 6.3.1 is a dependency with **zero
imports** anywhere in the source. Remove it rather than upgrade it.

**Alternatives considered**: Adopting `native-stack` on v6 to avoid the upgrade — viable, and a
legitimate fallback if the v7 upgrade proves disruptive. Recorded as the Phase B contingency.

---

## R4 — Can the five-way root switch survive `createStaticNavigation`?

**Decision**: Not as written. It must be collapsed into one navigator with guarded groups, and that
is a **behaviour change**, not a syntax conversion.

**Rationale**: `navigation.js`'s `renderNavigator()` returns a *different navigator component* per
state — `TimeoutStackScreen`, `VersionMismatchScreen`, `MainScreen`, `ApprovalScreen`,
`AuthStackScreen`. Swapping the navigator wholesale is what resets the back stack when a user signs
in or loses connection; that reset is load-bearing behaviour, not incidental.

`createStaticNavigation` takes **one** tree. React Navigation 7 handles conditionals with `if` on
screen groups inside a single navigator:

```js
const RootStack = createNativeStackNavigator({
  screens: { /* always available */ },
  groups: {
    SignedIn:  { if: useIsSignedIn,  screens: { /* … */ } },
    SignedOut: { if: useIsSignedOut, screens: { /* … */ } },
  },
});
```

Five states means five guards over one navigator, and the back-stack semantics at each boundary have
to be re-established deliberately — v7 unmounts screens whose group condition goes false, which
approximates but does not exactly reproduce a navigator swap.

**Consequence**: migration C is a design task, not a refactor. It is scoped last and gated on B
being shipped and measured.

**Alternatives considered**: Keeping the dynamic API indefinitely — entirely reasonable. The dynamic
API is not deprecated in v7 and the two can coexist. If the static API's benefits (inferred types,
generated linking config) are not wanted, C can be dropped with no loss to the performance work.

---

## R5 — What blocks the static conversion besides the root switch?

**Decision**: The asset preload must move out of `renderNavigator()` first.

**Rationale**: `renderNavigator()` calls `useAssets([...~80 requires...])` and a `useEffect` **inside
a nested function**, then gates the entire navigator tree on `if (!assets) return <splash />`.

This is legal today only because the function is invoked exactly once per render of `AppNavigation`
(`navigation.js`, single call site). It is fragile — a second call, or an early return added above
it, changes hook order and crashes — and ESLint's rules-of-hooks would flag it if ESLint ran in this
repo (it does not; see `002/follow-ups.md` F3).

More importantly for this feature: **a static navigator tree cannot contain that gate.** The preload
has to become either a component wrapping `<Navigation />`, or move into the splash-screen phase
with `expo-splash-screen` (already a dependency).

**Second-order benefit**: 80 `require()` calls resolved before the first screen renders is itself a
startup cost. Moving it is worth doing independently of this migration.

**Alternatives considered**: Leaving it and wrapping `<Navigation />` in an asset gate — simplest,
and probably correct. Recorded as the default approach.

---

## R6 — How is this verified without a navigation test suite?

**Decision**: Per-navigator device passes, plus the existing gates. No new test infrastructure.

**Rationale**: The repo has 27 Jest tests over pure logic and no React Native testing-library. Adding
a navigation test harness is a larger project than this migration.

What is checkable automatically:

```bash
npm run check:animation   # must stay green
npm run audit:lists       # must stay green
npm test                  # 27/27
```

What must be checked on device, per converted navigator: every screen still pushes and pops, every
custom header still renders, the back gesture works, and `navigationRef` still resolves — `navigate`
and `goback` in `src/navigation/navigate.js` are used from **75 call sites** and are the single
widest blast radius in the app.

**Measurement**: this migration is the only one that may claim a performance improvement, and only
against `006`'s baseline. If `006`'s T006 has not been run, run it first — if the lag turns out to
be the destination screen's mount rather than the transition, native-stack will not fix it and this
entire plan is aimed at the wrong target.

**Alternatives considered**: Snapshot-testing navigator configs — would catch option-shape mistakes
but not the header-rendering differences that are the actual risk.
