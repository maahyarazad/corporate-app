# Quickstart: validating screen disposal

**Feature**: `012-dispose-profile-and` | **Date**: 2026-09-10

How to prove `012` works. Half of it is a unit test; half of it needs a device, following the same
split `009` and `010` used — `jest-expo` has no renderer for `expo-maps`, so no amount of test code
will tell you whether a native map surface actually went away.

Details of the interfaces under test live in `contracts/screen-lifecycle.md`; the shapes being
asserted are in `data-model.md`.

---

## Prerequisites

```bash
npm install
```

A development build on a physical device for §3 onward. `expo run:android` / `expo run:ios`, or an
existing dev client with `npm start`. The Expo Go client is not sufficient — `expo-maps` needs the
dev build.

For §3.2 you also need a device the app has been signed into at least once, so `cache.db` has the
partner coordinates row that `011` writes.

---

## 1. Gates

Everything here must pass before and after the change.

```bash
npm test
npm run lint
npm run check:styles
npm run check:screen-props
npm run check:animation
npm run audit:lists
npm run check:cache-coverage
npm run check:main-return     # new in this feature
```

`check:main-return` is expected green on introduction — `navigate("Main"` appears once in `src/`
today and this feature replaces that call site (`contracts/screen-lifecycle.md` §3).

**To prove the gate actually bites**, add a throwaway file and confirm it fails (SC-005):

```bash
printf 'import { navigate } from "./navigation/navigate";\nnavigate("Main");\n' > src/__gate_probe.js
npm run check:main-return     # must exit non-zero and name src/__gate_probe.js
rm src/__gate_probe.js
```

A gate that has never been seen to fail has not been tested.

---

## 2. Unit tests — the return action (US1, no device)

New suite at `src/navigation/__tests__/navigate.test.js`. It is collected by the existing
`testMatch` pattern `**/src/**/__tests__/**/*.test.js` in `jest.config.js` — no config change.

```bash
npx jest src/navigation
```

Mock `navigationRef` and assert on what `dispatch` receives. What must be covered:

| Assertion | Guards |
|---|---|
| `routes` has length 1 and `routes[0].name === "Main"` | FR-001, `data-model.md` V1 |
| `index` is present and `0` | `data-model.md` V4 — the R8 failure mode |
| `params` is `{ screen: "Entertainer", params: { screen: "Home" } }` by default | FR-003, V5 |
| `returnToMain("Offers")` puts `"Offers"` in the innermost `screen` | E2 parameterisation |
| Nothing is dispatched when `isReady()` is false | G6 |

Do **not** write a test that asserts the stack is `[Main]` by running the real router — the router's
own truncation behaviour is `research.md` R1, verified against installed source, and re-testing a
third-party reducer here buys nothing.

---

## 3. Device verification

Static analysis cannot see a native view. These steps are the evidence for SC-002, SC-003 and
SC-004, and the result is recorded in a `docs(012):` commit the way `f0882b3` recorded `010`'s.

### 3.1 The doubled map (US2, SC-002)

This is the finding the feature request did not know about (`research.md` R3a), so verify the
"before" first.

1. Home → tap the map icon in the header. Wait for pins.
2. Tap any pin, then **View Offer** — you are on `Location View`, which mounts its own map preview.
3. **Before the change**: two native map surfaces are alive. Confirm it in the platform profiler —
   Android Studio's Layout Inspector shows both `MapView` instances; on iOS use the View Hierarchy
   debugger and look for two `MKMapView`s.
4. **After the change**: exactly one — the preview on `Location View`. The map underneath is gone.
5. Go back. The interactive map redraws with its pins.

Record which tool you used and what you saw. "It looked fine" is not verification.

### 3.2 Redraw without the network (SC-003)

Continuing from 3.1 step 5, with the debugger's network panel open:

- Returning to `Map` must issue **no** request to `/v2/partner/coordinates/100`. The row is served
  from SQLite under the 1-hour TTL that `011` set (`map.screen.js`, `PARTNER_CACHE_TTL_MS`).
- If you see the request, either the TTL has expired (wait less, or re-run) or the gate is
  remounting more than it should.

### 3.3 The stack is really empty (US1, SC-001)

1. Home → Map → a pin → **View Offer** → avail an offer far enough to reach `AvailOffer`.
2. From wherever you are, trigger the return to Main.
3. Press the hardware back button on Android **immediately**. It must exit the app — or do whatever
   `Main` does at stack index 0 — and must not reveal `AvailOffer`, `Location View` or `Map`.

Step 3 is the whole test. A visually correct home screen with a stale stack underneath looks
identical until the user presses back.

### 3.4 The `TransactionSummary` case (FR-011)

The one path where `Main` is not in the stack (`research.md` R8):

1. Complete a redemption so you land on `TransactionSummary`.
2. Trigger the return to Main.
3. Confirm you arrive at `Main` on the `Home` tab, and that back does not reveal
   `TransactionSummary`.

If `returnToMain` had been built on `navigate` or `popToTop`, this is where it would fail — with
`navigate` you would get `[TransactionSummary, Main]` and back would show the receipt again.

### 3.5 Freezing (US3, SC-004) — only if that story ships

`enableFreeze()` is app-wide, so the verification is app-wide too. Exercise every navigator, not
just this feature's screens:

- The three material top tabs in `Entertainer` — swipe between them, including fast repeated swipes.
  The `react-native-pager-view` under `material-top-tabs` is the most likely thing to object.
- `post-tabs`, `post-detail`, `post-entry` under `OverlappingNavigator`.
- The auth stack, the approval stack, and the no-connection root.
- Push notification arriving while backgrounded, then foregrounding.

Anything that renders while blurred is a candidate for breaking. If something does break, NFR-002
says the fix is deleting the line, not patching around it.

---

## 4. What is deliberately not verified here

- **That `goHome` unmounts `Profile` today.** It already does (`research.md` R1). Testing it would
  be testing `@react-navigation/routers`.
- **Whether the redemption reset should collapse the whole stack.** `research.md` R8 records that it
  does and that it leaves `TransactionSummary`'s back button inert. That is a product decision about
  a flow `012` does not own — flag it, do not fix it here.
- **Memory numbers.** No leak was found (`research.md`, Summary of `spec.md`), so a heap comparison
  would be measuring the wrong thing. The claim is "a native view is released earlier", and §3.1
  measures exactly that.

---

## 5. Rollback

| Story | How to revert |
|---|---|
| US1 | Restore `goHome` at `profile.screen.js:43`; delete the helper and its test. |
| US2 | Remove the `isFocused &&` term from the `PlatformMap` branch in `map.screen.js`. |
| US3 | Delete the `enableFreeze()` line (NFR-002). |
| US4 | Remove the script and its `package.json` entry. |

Each story reverts independently. That is what makes them separately shippable, and it is why US3 —
the only app-wide one — is ordered last.
