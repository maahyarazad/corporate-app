# Status — Static Navigation migration

## One task shipped. The rest is correctly blocked.

`/speckit-implement` ran with no Android device available. **T001 — the aim check — gates the entire
feature**, and it cannot be run here. Only the task that is unconditionally safe regardless of what
the aim check says was performed.

## Done

### T004 — removed `@react-navigation/bottom-tabs`

A direct dependency at 6.3.1 with **zero imports**. `createBottomTabNavigator` appears nowhere in
the source, and `npm ls` showed no dependents.

**Checked for a false positive first**: `grep bottom-tabs src/` returns 10 hits, but every one is an
i18n translation key — `i18n.t("bottom-tabs.home")` and similar in `src/utils/routes.js`,
`src/screens/entertainer.screen.js`, `src/screens/events/eventDetail.screen.js` and
`src/screens/login/login.screen.js`. Those are strings in the translation catalogue and are
unaffected by removing the package.

This is dead-dependency removal, not migration work — it is worth doing whether or not native-stack
turns out to be the answer, which is why it was not held behind the gate.

Verified: no broken imports repo-wide, navigation entry points parse, all three gates green
(`check:animation`, `audit:lists`, `npm test` 27/27).

## Blocked — and why nothing else was done

### T001 is the gate, and it needs a device

```
# in navigation.js, temporarily add to slideFromRight:
#   animationEnabled: false
```

Rebuild release, repeat the slow transition.

- **Lag disappears** → the transition is the cost → this migration is aimed correctly.
- **Lag persists** → the destination screen's **mount** is the cost → **native-stack will not fix
  it**, and the right work is `006` US4 (the `react-native-maps` `MapView` in
  `src/components/map/map.component.js`), not a 41-screen navigator migration.

Running the v7 upgrade or the native-stack conversion before knowing which of those is true would
spend the largest budget in the plan on a target that may be wrong.

### T003 has no baseline to capture

`006` was never measured — there is no `follow-ups.md` in `specs/006-android-navigation-lag/` with
numbers, because that investigation also stopped at the device boundary. Without a before, US3
("prove it") cannot conclude anything, and T018's decision gate has nothing to compare against.

### T005 — version alignment — deliberately not done

Aligning the drifted v6 versions (`native` 6.0.10, `stack` 6.2.1, `material-top-tabs` 6.6.14,
`elements` 1.3.31) means an `npm install` that changes runtime code across every navigator. Its own
acceptance criterion is *"no behaviour should change"* — which requires a device to confirm.

It is cheap and low-risk, but it is not verifiable here, and it sits after T001 in the dependency
graph. Left for whoever runs the aim check.

## The order to pick this up in

1. **T001** — one rebuild. It either confirms the aim or redirects the whole effort to `006` US4.
2. **T003** — capture a real baseline while the device is in hand.
3. **T005** → **Phase 2** (v7, dynamic config unchanged) → **US1** (`AuthStack` prototype only).
4. **T018** — measure the prototype. If native-stack does not beat the JS stack on 15 screens, stop
   and keep v7 on the dynamic API rather than converting the other 26.

## Reminder about the requested snippet

`createStaticNavigation` is US4/US5 and is marked contingent. It has **zero runtime effect** on
transition performance (`research.md` R1) — it changes how navigators are declared, not how they
run. It is also the hardest part, because `navigation.js` swaps between five root navigators by
state and a static tree takes one (`research.md` R4).

If the goal is the Android lag, the static API can be skipped entirely.

---

# Update — static configuration implemented on AuthStack

## What shipped

**T006 — React Navigation 6 → 7 + native-stack** (commit `2c2d8de`). `createStaticNavigation` does
not exist in v6.0.10, so the upgrade was a hard prerequisite. First install failed ERESOLVE because
npm resolved against the stale tree (`stack@6.2.1` still demanding `elements@^1.3.3`); uninstalling
the v6 set and installing v7 clean fixed it.

**T013–T015 — `AuthStack` converted to the static configuration.**

```js
const AuthStackScreen = createNativeStackNavigator({
  initialRouteName: "Login",
  screenOptions: noHeader,
  screens: {
    Login: LoginScreen,
    "Unverified Email": { screen: UnverifiedEmailScreen, options: slideFromRightNative },
    // …
  },
});
```

## The design decision that made this incremental

`createStaticNavigation` is root-only, and this app's root swaps between **five** navigators by
state — collapsing that is the hardest part of the migration (`research.md` R4).

That is not required to adopt the static config. `createNavigatorFactory` in
`node_modules/@react-navigation/core/lib/module/createNavigatorFactory.js:17-40` returns a
**renderable component** when given a config object. So `AuthStackScreen` is still rendered as
`<AuthStackScreen />` at `navigation.js:699`, inside the existing dynamic root, and the five-way
switch is untouched.

`createStaticNavigation` becomes necessary only when the static tree owns the container — that is
still US5, still contingent, and still needs the root collapse and the asset-preload extraction.

## Option translation (contracts C3)

native-stack has no `cardStyleInterpolator` — the platform owns the transition. A separate constant
was added rather than editing `slideFromRight`, which four other **still-dynamic** navigators use:

| v6 `slideFromRight` | `slideFromRightNative` |
|---|---|
| `cardStyleInterpolator: forHorizontalIOS` | `animation: "slide_from_right"` |
| `gestureDirection: "horizontal"` | unchanged |
| `gestureResponseDistance: 200` | unchanged (number; v6's object form is gone) |
| `headerShown: false` | unchanged |

## Structural verification

Route names are what `navigate()` is called with from 75 call sites, so they were diffed
mechanically against the JSX they replaced rather than eyeballed:

- **15/15 screens present**, names byte-identical including `"Login Privacy Policy"` and
  `"Unverified Email"` with their spaces
- Every component identical
- Every `slideFromRight` became `slideFromRightNative`; the two bare screens still inherit
  `screenOptions: noHeader`
- The now-unused `const AuthStack = createStackNavigator()` removed

Gates green: `check:animation`, `audit:lists`, `npm test` 27/27, parse and import checks clean.

## NOT verified — this is the important part

No device was available. **Nothing here has been run.** Specifically open:

| Task | What it checks |
|---|---|
| T009 | `navigationRef` still resolves under v7 — 75 call sites, push notifications, deep links |
| T010 | All five root states still render their navigator |
| T011 | 53 custom header options survive the v7 upgrade |
| T016 | Every `AuthStack` screen pushes/pops; swipe-back works |
| T017 | **The measurement** — does native-stack actually beat the JS stack here? |
| T018 | The decision gate that says whether to convert the other 26 screens |

The v7 upgrade in particular touches every navigator in the app, not just the converted one. It
needs a full pass across all five root states before this branch goes anywhere.

## Still true, and still the first thing to do

`006`'s aim check has not been run. If the lag survives `animationEnabled: false`, the cost is the
destination screen's mount and native-stack will not fix it — in which case this conversion is a
maintainability change, not a performance one.

---

# Update — static configuration for all the stacks in `navigation.js`

## Converted (6 navigators, 41 screens)

| Navigator | File | Screens |
|---|---|---|
| `AuthStackScreen` | `navigation.js` | 15 (earlier commit `e239115`) |
| `TimeoutStackScreen` | `navigation.js` | 1 |
| `ApprovalScreen` | `navigation.js` | 4 |
| `OverlappingNavigator` | `navigation.js` | 10 |
| `MainScreen` | `navigation.js` | 10 |
| `HomeNavigation` | `src/screens/homenavigation.js` | 1 |

`createStaticNavigation` is still **not** used — the five-way root switch stays. Each static
navigator is a renderable component, so `AppNavigation` is unchanged.

## Option translation, verified against the type definitions

Checked `node_modules/@react-navigation/native-stack/lib/typescript/src/types.d.ts` rather than
guessing. **Five options have no native-stack equivalent and were dropped, not renamed:**

| Dropped | Where it was | Replacement |
|---|---|---|
| `detachPreviousScreen` | `keepPreviousScreenAttached` on `OverlappingStack` | none — see the warning below |
| `headerBackTitleVisible` | `plainBlackHeader`, `TransactionSummary` | `headerBackButtonDisplayMode: "minimal"` |
| `headerLeftLabelVisible` | `postDetailOptions`, `postEntryOptions` | none (was inert where `headerShown: false`) |
| `headerLeftContainerStyle` | `entertainerScreenOptions` | none — absorb into `renderEntertainerHeaderLeft` if the logo padding looks wrong |
| `headerRightContainerStyle` | `entertainerScreenOptions` | none — same |

Translated rather than dropped: `cardStyleInterpolator: forHorizontalIOS` → `animation:
"slide_from_right"`; `forVerticalIOS` → `"slide_from_bottom"`; `headerStyle: { shadowColor:
"transparent" }` → `headerShadowVisible: false`.

## ⚠️ The regression to watch for

`keepPreviousScreenAttached` (`detachPreviousScreen: false`) is **gone** from `OverlappingStack`.
Commit `7a1b9f4` added it specifically to stop the Entertainer screen jolting on return. There is no
native-stack equivalent. **If that jolt reappears, this is why** — and it needs its own fix rather
than a shrug. This is the single most likely visible regression from the conversion.

## Two decisions taken

**`layout` for the provider.** The `<BottomSheetModalProvider>` wrapper moved into the static
config's `layout` key. Verified this is legal: `layout` is a member of `DefaultNavigatorOptions`
(`core/types.d.ts:112-122`), and `StaticConfigInternal` intersects that type while omitting only
`screens`/`children`. It is not merely a navigator prop.

**`TransactionSummary`'s title.** Its options read `i18n` from context, which a module-scope static
config cannot do. The title moved into `src/screens/offer/transactionSummary.screen.js` as a
`useLayoutEffect` + `navigation.setOptions`. The screen already had `navigation` and `i18n` in scope.
That was the last thing keeping `MainScreen` a component.

## Scope the task list missed

`@react-navigation/stack` **cannot be removed** (T031). Two navigators outside the surveyed files
still use it, found only when the import removal exposed them:

- `src/screens/posts/postNavigation.screen.js:15` — `PostStackScreen`
- `src/screens/profile/profile.screen.js:31` — `ProfileStack`

The original survey covered `navigation.js`, `homenavigation.js` and `entertainer.screen.js` only.
These two need converting before US5 can finish.

Also unconverted by design: the `material-top-tabs` navigator in
`src/screens/entertainer.screen.js`, whose tab list is built from `useMemo` over `i18n` — the same
context problem as `TransactionSummary`, but for the whole config rather than one option (T027).

## Verification

Structural, not by eye. Every route name and component diffed mechanically against the JSX it
replaced: **25/25 screens across the four navigators converted in this pass, zero mismatches**, with
every option mapped to its expected native counterpart. Route names matter because they are what
`navigate()` is called with from 75 call sites.

Also confirmed: no stale references to any deleted constant, `createStackNavigator` and
`CardStyleInterpolators` gone from `navigation.js` code, imports all resolve.

Gates: `check:animation`, `audit:lists`, `npm test` 27/27.

## Still not verified — no device

Nothing here has run. Highest risks in order: the Entertainer return-jolt (above), the imperative
`changeHeaderRight` under a native header, the three `presentation: "modal"` screens now rendering
as native modals, and `renderBackArrow` / `renderZurueckBack` / `renderPostSelectBack` in native
headers.
