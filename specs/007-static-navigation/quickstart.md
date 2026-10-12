# Quickstart: Validating the Navigation Migration

Four phases, each verified before the next starts. Nothing here is checkable by the test suite — the
27 Jest tests cover pure logic and nothing covers navigation.

## Prerequisites

- Physical Android device **and** an iOS device. This migration changes both platforms; Android is
  the motivation, iOS is the regression risk
- Release build for anything measured: `npx expo run:android --variant release`
- `006`'s baseline numbers, or this migration cannot prove anything

## Before you start — run `006`'s T006

```bash
# in navigation.js, temporarily add to slideFromRight:
#   animationEnabled: false
```

Rebuild release and repeat the slow transition.

- **Lag disappears** → the transition is the cost → this migration is aimed correctly. Continue.
- **Lag persists** → the destination screen's *mount* is the cost → **native-stack will not fix it**.
  Stop and work `006` US4 (the `MapView` in `src/components/map/map.component.js`) instead.

Spending a 41-screen migration on the wrong target is the expensive mistake this step prevents.

---

## V1 — Phase A: version alignment

```bash
npm install
npm run check:animation && npm run audit:lists && npm test
npx expo run:android --variant release
```

- [ ] App boots and sign-in works
- [ ] `@react-navigation/bottom-tabs` removed and nothing broke (it had zero imports)
- [ ] All six navigators still push and pop

No behaviour should change at all. If anything does, stop — the v6 line was not as aligned as
assumed.

---

## V2 — Phase B: v6 → v7, dynamic config unchanged

Every navigator still uses `createStackNavigator`. This isolates upgrade breakage from renderer
breakage.

- [ ] App boots on both platforms
- [ ] **`navigationRef` resolves** — verified by tapping a push notification and following a
      `gecmobile://` deep link. `contracts/navigation-api.md` C1; 75 call sites depend on it
- [ ] Each of the five root states renders its navigator: normal launch, airplane mode
      (`TimeoutStack`), signed out (`AuthStack`), unapproved (`ApprovalStack`), signed in (`Main`)
- [ ] All 53 custom headers still render — they are still JS headers at this point
- [ ] The `Entertainer` imperative header still updates on tab press

---

## V3 — Phase C: native-stack, one navigator per commit

Run this list **per navigator**, starting with `AuthStack` (15 screens, simplest headers).

- [ ] Every screen pushes and pops
- [ ] Transition animation looks right — `animation: "slide_from_right"` replacing
      `cardStyleInterpolator`
- [ ] Swipe-back gesture works
- [ ] `headerTitle` renders, centres, and truncates acceptably at its **longest realistic value**
      (26 sites; native centring differs from the JS header)
- [ ] Custom `headerLeft` still navigates back (18 sites) and the native back gesture is intact
- [ ] `headerRight` renders (9 sites)
- [ ] Options recorded in `contracts/navigation-api.md` C3 are mapped, and any deliberately dropped
      one is written into `follow-ups.md`

**Specific high-risk checks:**

- [ ] `src/screens/entertainer.screen.js` — `changeHeaderRight` sets `headerRight` imperatively via
      `navigation.setOptions`. Greeting, search, map, bell and avatar must still update on tab press
- [ ] `src/screens/location/location-view.screen.js` — the `002` sticky header driven by
      `useAnimatedScrollHandler` must still slide, clamp, and pull-to-refresh
- [ ] `src/screens/homenavigation.js` — delete the now-redundant `detachInactiveScreens`

---

## V4 — Phase D: measure

The point of the exercise. Release build, physical Android device.

```bash
adb shell dumpsys gfxinfo com.buenapublica.GECRewards reset
# 10 push/pop cycles on the transition 006 identified as worst
adb shell dumpsys gfxinfo com.buenapublica.GECRewards framestats
```

- [ ] Median of 3 runs, device cooled between runs
- [ ] Compared against `006`'s baseline, same device, same scenario
- [ ] Result recorded in `follow-ups.md`: device, transition, before, after, delta

**If the number did not move, native-stack was not the answer.** Say so, and revert or keep the
migration on its maintenance merits — but do not claim a performance win. `contracts/navigation-api.md` C7.

---

## V5 — Phase E: static API (contingent)

Only after B, C and D are done and measured.

- [ ] Asset preload extracted from `renderNavigator()` in `navigation.js` (blocker E1) — the app
      still shows the splash until assets resolve
- [ ] The five root states still reach the right screens (blocker E2) — this is the behaviour most
      likely to change
- [ ] **Back-stack behaviour at each boundary** (blocker E3): signing in, signing out, losing
      connection, and the version-mismatch path each leave the stack in the expected state, with no
      way to back into a screen the user has signed out of
- [ ] Every route name unchanged — `contracts/navigation-api.md` C2. Push destinations resolve by
      exact string, spaces included
- [ ] `navigationRef` still resolves through `<Navigation ref={navigationRef} />`

---

## Regression checklist

- [ ] Both platforms, release builds
- [ ] Push notification tap → correct screen (exercises `navigationRef` and route names together)
- [ ] `gecmobile://` deep link → correct screen
- [ ] All five root states verified
- [ ] `npm run check:animation`, `npm run audit:lists`, `npm test` green
- [ ] No performance claim made without a V4 number

## Rollback

| Phase | Rollback |
|---|---|
| A, B | `git revert` + `npm install` |
| C | Per navigator — one commit each, revert individually |
| E | `git revert`; the dynamic API is not deprecated in v7 and can stay indefinitely |
