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
