# Implementation Plan: Event Push Notification Deep Link

**Branch**: `001-event-push-deeplink` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-event-push-deeplink/spec.md`

## Summary

Event push notifications are delivered successfully by Expo but tapping one does not
open the event, while the identical partner flow works. Navigation wiring for the two
destinations is symmetric, so the asymmetry is either in the payload the server emits
for events or in `EventDetailScreen` failing to load and rendering nothing.

The approach: pull destination resolution out of the screen into one tolerant,
testable module that accepts the server's `destination_type`/`destination_id` naming
as well as today's `path`/`id`, normalises type and coerces id; make
`EventDetailScreen` fail visibly instead of blankly; de-duplicate cold-start taps;
and log the raw payload in dev builds so the server contract is confirmed rather than
assumed.

## Technical Context

**Language/Version**: JavaScript (ES2021), React 19 / React Native via Expo SDK 54

**Primary Dependencies**: `expo-notifications`, `@react-navigation/native` v6 (stack +
material-top-tabs), `axios` via `hooks/useRequest.js`, `expo-linking`

**Storage**: N/A for this feature (push token persisted via `expo-secure-store`;
unchanged)

**Testing**: Jest is configured (`npm test`, `NODE_ENV=test jest`). No test suite
currently exercises notification handling. New logic is extracted into a pure module
specifically so it can be unit tested; end-to-end verification is manual on device.

**Target Platform**: iOS (Hermes) and Android, physical devices only — Expo push
requires real hardware

**Project Type**: Mobile app (single Expo/React Native client). The notification
server lives outside this repository.

**Performance Goals**: Navigation from notification tap to Event Detail mount within
one frame of the handler firing; no perceptible regression to app cold start.

**Constraints**: Client-only change. The server payload cannot be modified as part of
this work, so the client must adapt to it. Production builds strip `console.*`
(`App.js:30-38` plus `transform-remove-console` in `babel.config.js`), so payload
diagnostics are dev-build only by construction.

**Scale/Scope**: 3 destination types (partner, event, post), 2 entry points
(notification tap, deep link URL), ~4 files touched.

## Constitution Check

`.specify/memory/constitution.md` is the unmodified Speck-Kit template — every
principle is still a `[PRINCIPLE_N_NAME]` placeholder. There are no ratified project
gates to evaluate.

**Gate result**: PASS (vacuous — no constitution defined).

**Note**: This is not a free pass, it is an absence of policy. The plan holds itself
to the repository's own observable conventions instead: dev-only logging (`__DEV__`
guards, per `App.js`), `showToast` for user-facing errors, `navigate`/`goback`
helpers rather than raw navigation refs, and no new dependencies.

**Post-Phase 1 re-check**: PASS. The design adds one pure utility module and no
architectural surface; nothing to justify in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-push-deeplink/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── push-payload.md  # Phase 1 output — notification data contract
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── utils/
│   ├── pushDestination.js          # NEW — payload → { screen, params } resolver
│   └── urlRouter.js                # MODIFIED — consume the shared resolver
├── screens/
│   ├── entertainer.screen.js       # MODIFIED — use resolver, de-dupe taps, dev log
│   └── events/
│       └── eventDetail.screen.js   # MODIFIED — loading/error/empty states, always-
│                                   #            mounted back control
└── navigation/
    └── navigate.js                 # UNCHANGED — reference only

navigation.js                       # UNCHANGED — reference only; both destinations
                                    #             already registered in MainStack
```

**Structure Decision**: This is a single Expo/React Native client, so none of the
template's multi-project layouts apply. Changes stay inside the existing `src/`
convention: shared pure logic in `src/utils/`, screens in `src/screens/`. One new
file; three modified. No new directories, no new dependencies, no navigator changes —
`Location View` and `Event Detail` are already sibling screens in `MainStack`
(`navigation.js:475` and `navigation.js:502`).

## Implementation Phases

### Phase A — Confirm the payload (blocking for the exact fix, not for the rest)

Add a `__DEV__`-guarded log of the raw
`response.notification.request.content.data` in the tap handler, run a test push of
each destination type against a dev build, and record the literal keys and values in
`contracts/push-payload.md`. This converts the one open question in `research.md`
into a fact. Everything in Phase B is worth shipping under either answer.

### Phase B — Client hardening

1. **`src/utils/pushDestination.js`** — pure function
   `resolvePushDestination(data)` returning `{ screen, params }` or `null`. Reads the
   type from `path`, `destination_type`, or `type`; the id from `id`,
   `destination_id`, or `entity_id`. Lowercases and singularises the type. Coerces the
   id to a number and rejects non-numeric ids. Maps `partner → Location View {locId}`,
   `event → Event Detail {id}`, `post → post-detail {id, origin:"push"}`.
2. **`src/screens/entertainer.screen.js`** — replace the inline `switch` with the
   resolver; de-duplicate by `response.notification.request.identifier` so the
   cold-start replay and the live listener cannot double-navigate one tap.
3. **`src/screens/events/eventDetail.screen.js`** — hoist the back control out of the
   `{eventDetails && …}` wrapper so it is always mounted; add explicit loading, error,
   and not-found states; surface `response.success === false` as an error instead of
   swallowing it.
4. **`src/utils/urlRouter.js`** — route through the same resolver, deleting the dead
   `eventList.find` whose callback never returns (`urlRouter.js:27-30`).

### Phase C — Verification

Unit-test the resolver against the payload shapes in `contracts/push-payload.md`.
Then walk the device matrix in [quickstart.md](./quickstart.md): partner and event,
each in foreground / background / cold start, on iOS and Android.

### Escalation condition

If Phase A shows the server omits the destination pair from the Expo `data` object
entirely for events, no client change can fix the routing. Phase B still ships (it is
correct and it fixes the blank-screen defect), and the server payload gap is raised
as a separate server-side issue with the captured evidence attached.

## Complexity Tracking

No Constitution Check violations. Table intentionally empty.
