# Quickstart: Validating the Event Push Deep Link

**Feature**: `001-event-push-deeplink` | **Date**: 2026-08-25

This is a run/validation guide. Implementation belongs in `tasks.md`.

## Prerequisites

- A **physical** iOS or Android device. `registerForPushNotificationsAsync` throws on
  simulators (`Device.isDevice` guard, `src/screens/entertainer.screen.js`).
- A development build — production builds no-op every `console.*`
  (`App.js:30-38`) and Babel strips the calls entirely, so payload diagnostics are
  invisible there.
- An authenticated account whose push token is registered
  (`notification/save-push-token`).
- Ability to trigger a test push per destination type, as in the supplied log
  (`is_test = 1`), with a known partner id and event id. The reference pair is
  partner `1592` (20Four) and event `720` (BusinessBreakfast - AI Forum).

## Setup

```bash
npm install
npx expo run:ios      # or: npx expo run:android
```

Watch the JS logs while the app runs:

```bash
npx expo start --dev-client
```

## Phase A — Capture the real payload

1. Background the app.
2. Send a **partner** test push. Tap it.
3. Send an **event** test push. Tap it.
4. In the Metro/dev-client log, find the dev-only payload dump from the tap handler.
5. Record both raw `data` objects verbatim in the confirmation table of
   [contracts/push-payload.md](./contracts/push-payload.md).

**Expected outcome**: two JSON objects. Compare their key names and values. If the
event object's type value is not `event`, or its keys differ from the partner
object's, that is the root cause and the resolver's normalisation rules cover it.
If the event object carries no destination fields at all, stop and escalate to the
server team — see the escalation condition in [plan.md](./plan.md).

## Unit validation — the resolver

```bash
npm test
```

**Expected outcome**: `resolvePushDestination` tests pass for every accepted shape and
normalisation rule in [contracts/push-payload.md](./contracts/push-payload.md),
including the `"720"`-as-string case, the `"Events"` plural/case case, and `null` for
unknown types, missing ids, and non-numeric ids.

## Device matrix — the acceptance scenarios

Run each cell for **partner (1592)** and **event (720)**. Partner is the control: it
works today and must still work after the change.

| App state | How to set it up | Expected |
|---|---|---|
| Foreground | App open on the Entertainer tab | Banner shows; tapping opens the destination screen |
| Background | Home-gesture out, leave app running | Tapping foregrounds the app on the destination screen |
| Cold start | Force-quit the app entirely | Tapping launches the app and lands on the destination screen **once** — no duplicate stacked screen (swipe back should reveal the tab screen, not a second copy) |

**Event expected outcome (US-001, US-002)**: Event Detail for 720 showing
"BusinessBreakfast - AI Forum" with date, place, cover image, map, and the
attend/unattend button.

**Partner expected outcome (US-003)**: Location View for 1592 — unchanged from
today's behaviour.

## Failure-state validation (US-001 scenario 2, FR-005, FR-006)

Force the event detail request to fail — send a push for an event id that does not
exist, or put the device in airplane mode immediately after tapping.

**Expected outcome**: a visible error state with a working back control. Specifically
**not** the current behaviour, which is a blank white screen with no way back
(`src/screens/events/eventDetail.screen.js:333` wraps the back button inside the
`{eventDetails && …}` guard).

Repeat with the device online but the event unavailable in the selected language
(switch language, then tap) to exercise the empty state.

## Malformed payload validation (US-004)

Send a test push with an unrecognised destination type, and one with a missing
destination id.

**Expected outcome**: the app opens normally to its default screen, logs a dev-only
diagnostic naming the unresolved payload, and does not crash or hang.

## Deep-link regression check

The URL listener shares the resolver after this change
(`src/utils/urlRouter.js`). Verify both schemes still route:

```bash
npx uri-scheme open "<scheme>://partner?id=1592" --ios
npx uri-scheme open "<scheme>://event?id=720" --ios
```

**Expected outcome**: same destinations as the equivalent push notifications.

## Done when

- Both raw payloads are recorded in the contract's confirmation table.
- Every cell of the device matrix passes on iOS and Android.
- Failure, empty, and malformed states all render something with a working back
  control.
- Partner and post destinations show zero behavioural change.
