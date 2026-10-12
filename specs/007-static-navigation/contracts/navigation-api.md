# Contract: Navigation API

What must not change while the navigator implementation underneath it does.

## C1 — `navigate` / `goback` are frozen

`src/navigation/navigate.js` is consumed from **75 call sites across 45 files**, including the push
notification handler (`src/screens/entertainer.screen.js`) and the deep-link handler
(`src/utils/urlRouter.js`).

```
navigate(name, params) -> void
goback() -> void
navigationRef            // createNavigationContainerRef()
```

**No phase of this migration may change these signatures.** v7 keeps
`createNavigationContainerRef`, and `createStaticNavigation` accepts
`<Navigation ref={navigationRef} />`.

Every phase must verify the ref still resolves. A silent failure here breaks push-notification
routing and deep links — paths with no automated coverage and no visible error.

## C2 — Route names are frozen

Route names are strings passed from `resolvePushDestination` and from 75 `navigate()` call sites.
`"Location View"`, `"Event Detail"`, `"post-detail"`, `"LocationList"`, `"Map"`, `"Profile"`,
`"notifications"`, `"post-search"` and the rest **must keep their exact spelling**, spaces included.

The static API infers types from the config keys — a tempting moment to "tidy" names. Renaming any
route silently breaks a push destination.

## C3 — Screen options must be translated, never dropped

For each converted screen, every option in `data-model.md`'s translation table is either mapped or
**explicitly recorded as intentionally dropped** in `follow-ups.md`. Silently losing an option is
the failure mode this contract exists to prevent.

Specifically:
- `cardStyleInterpolator` → `animation`
- `cardStyle` → `contentStyle`
- `detachPreviousScreen` → deleted (native-stack manages it)
- `gestureResponseDistance` → number only

## C4 — Header components keep their behaviour

53 custom header options exist (`headerTitle` 26, `headerLeft` 18, `headerRight` 9). native-stack
hosts these in a **native** header.

After each navigator converts, verify on device:
1. Titles render, centre correctly, and truncate acceptably at their longest realistic value.
2. Custom `headerLeft` still navigates back, and the platform back gesture still works.
3. `changeHeaderRight` in `src/screens/entertainer.screen.js` — set imperatively via
   `navigation.setOptions` — still updates the greeting, search, map, bell and avatar.

## C5 — Phase independence

Each phase ships and reverts alone:

| Phase | Revertable by |
|---|---|
| A — version alignment | `git revert`, `npm install` |
| B — v6 → v7 | `git revert`, `npm install` |
| C — native-stack | Per navigator; one navigator per commit |
| E — static API | `git revert`; the dynamic API is not deprecated in v7 |

**Phase C must convert one navigator per commit.** A single commit converting 41 screens cannot be
bisected when a header regresses.

## C6 — Existing gates stay green

```bash
npm run check:animation
npm run audit:lists
npm test                  # 27/27
```

None of them cover navigation, so they are a floor, not a verification. Passing them proves nothing
about this migration; failing them proves something broke.

## C7 — Only Phase C may claim a performance result

Phases A, B and E are ergonomics and maintenance. `createStaticNavigation` in particular has **zero**
runtime effect on transitions (`research.md` R1).

Any performance claim must cite a before/after measurement against `006`'s baseline, on a release
build, on a physical Android device.
