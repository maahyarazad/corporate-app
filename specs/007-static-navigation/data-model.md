# Phase 1 Design: Migration Surface

The entities are the navigators and the options that must be translated. Verified against the tree
on 2026-08-31.

## Navigators

| # | Navigator | File | Screens | Converts in | Notes |
|---|---|---|---|---|---|
| N1 | `AuthStack` | `navigation.js` | 15 | **Phase C first** | Self-contained; mostly `headerShown: false`; no imperative headers |
| N2 | `OverlappingStack` | `navigation.js` | 10 | Phase C | Hosts `Entertainer`, which owns the imperative header |
| N3 | `MainStack` | `navigation.js` | 10 | Phase C | Profile/Map; several custom headers |
| N4 | `ApprovalStack` | `navigation.js` | 4 | Phase C | |
| N5 | `TimeoutStack` | `navigation.js` | 1 | Phase C | Trivial |
| N6 | `HomeStack` | `src/screens/homenavigation.js` | 1 | Phase C | Carries a redundant `detachInactiveScreens` (already the Android default — `006/follow-ups.md`) |
| N7 | `Tab` | `src/screens/entertainer.screen.js` | 3 | **Not converted** | `material-top-tabs` has no native-stack equivalent; upgrade to v7 only |

**41 screens total.** N7 stays a JS navigator — it is a swipeable tab pager backed by
`react-native-pager-view`, which is already native.

---

## Option translation table

Every option currently used, and what it becomes. This is the checklist for each converted screen.

| v6 `stack` option | Uses | native-stack | Risk |
|---|---|---|---|
| `headerShown` | many | `headerShown` | None |
| `cardStyleInterpolator: forHorizontalIOS` | 4 | `animation: "slide_from_right"` | **None functionally, but this is the whole point** — the animation stops being JS work |
| `cardStyle` | 4 | `contentStyle` | Low — rename |
| `gestureDirection: "horizontal"` | 5 | `gestureDirection` | Low — narrower support, horizontal is supported |
| `gestureResponseDistance: 200` | 4 | `gestureResponseDistance` | Low — **number only**; v6 also accepted `{ horizontal, vertical }` |
| `detachPreviousScreen` | 2 | **delete** | None — native-stack manages this |
| `animationEnabled: false` | 0 (used only as `006`'s experiment) | `animation: "none"` | None |
| `headerTitle` | 26 | `headerTitle` | **Medium** — native centring and truncation differ |
| `headerLeft` | 18 | `headerLeft` | **Medium** — replaces the native back button |
| `headerRight` | 9 | `headerRight` | **Medium** — hosted natively |
| `headerStyle` | 2 | `headerStyle` | Low — narrower property set |

**Not present, and that is good news:**
- `header:` (fully custom header) — **0 real uses.** The 5 grep hits are StyleSheet keys.
- `TransitionPresets`, `transitionSpec`, `cardOverlayEnabled`, `headerMode` — 0 uses.

---

## The root switch (blocks Phase E only)

`navigation.js` → `AppNavigation` → `renderNavigator()`:

| Condition | Renders |
|---|---|
| `!assets` | splash `<Image>` |
| `noConnection` | `TimeoutStackScreen` |
| `isOutdated` | `VersionMismatchScreen` |
| `phoneVerified && refreshToken && (isAuthorized \|\| isSkip)` | `MainScreen` |
| `phoneVerified && refreshToken` | `ApprovalScreen` |
| otherwise | `AuthStackScreen` |

Five navigator components, swapped wholesale. `createStaticNavigation` accepts **one** tree, so
Phase E must express these as guarded groups within a single navigator. That changes back-stack
behaviour at each boundary — see `research.md` R4.

**Phases B, C and D do not touch this.** The dynamic API stays; only the navigator factory changes.

---

## Blockers specific to Phase E

| # | Blocker | File | Fix |
|---|---|---|---|
| E1 | `useAssets(...)` + `useEffect` called inside the nested `renderNavigator()` function, gating the whole tree on ~80 asset requires | `navigation.js` | Move into a component wrapping `<Navigation />`, or into the `expo-splash-screen` phase |
| E2 | Five-way root switch | `navigation.js` | Collapse to one navigator with `if`-guarded groups |
| E3 | Back-stack reset semantics at each auth boundary | `navigation.js` | Re-establish deliberately; v7 unmounts screens whose group guard goes false, which approximates but does not equal a navigator swap |

---

## Highest blast radius

`src/navigation/navigate.js` exposes `navigate` / `goback` through `navigationRef`, used from
**75 call sites across 45 files**. It is `createNavigationContainerRef()`, which v7 keeps and
`createStaticNavigation` supports via `<Navigation ref={navigationRef} />`.

**Nothing in this migration should change that module** — but every phase must verify it still
resolves, because a silent failure there breaks push notifications and deep links, not just
in-app navigation.

---

## Dependency changes

| Package | Now | Action |
|---|---|---|
| `@react-navigation/native` | 6.0.10 | → 7.x |
| `@react-navigation/stack` | 6.2.1 | → 7.x, then removed once all navigators convert |
| `@react-navigation/native-stack` | **not installed** | add at 7.x |
| `@react-navigation/material-top-tabs` | 6.6.14 | → 7.x |
| `@react-navigation/elements` | 1.3.31 | → 2.x (v7 line) |
| `@react-navigation/bottom-tabs` | 6.3.1 | **remove — zero imports** |
| `react-native-screens` | 4.16.0 | unchanged; satisfies v7's `>= 4.0.0` |

No native module additions, so no config plugin changes. A rebuild is still required.
